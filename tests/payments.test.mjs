import assert from "node:assert/strict";
import test from "node:test";
import { runPaymentFinalization } from "../lib/payments/finalize-core.ts";
import { MAX_ONEPAY_CALLBACK_BYTES, readOnePayCallback } from "../lib/payments/webhook.ts";

const callbackRequest = (body, headers = {}) =>
  new Request("https://mynix.test/api/onepay/callback", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });

test("accepts the documented OnePay callback object", async () => {
  const result = await readOnePayCallback(
    callbackRequest(JSON.stringify({ transaction_id: "WQBV118E584C83CBA50C6", status: 1, status_message: "SUCCESS", additional_data: "" })),
  );
  assert.deepEqual(result, {
    ok: true,
    callback: { transaction_id: "WQBV118E584C83CBA50C6", status: 1, status_message: "SUCCESS", additional_data: "" },
  });
});

test("rejects malformed, non-object, and invalid callback data", async () => {
  for (const body of ["{", "null", "[]", "{\"transaction_id\":\"bad\"}", "{\"transaction_id\":\"abcdef\",\"status\":\"1\"}"]) {
    const result = await readOnePayCallback(callbackRequest(body));
    assert.deepEqual(result, { ok: false, status: 400 });
  }
});

test("rejects declared oversized content before reading the body", async () => {
  const request = callbackRequest("{}", { "content-length": String(MAX_ONEPAY_CALLBACK_BYTES + 1) });
  assert.deepEqual(await readOnePayCallback(request), { ok: false, status: 413 });
});

test("enforces the callback limit while streaming even when Content-Length is false", async () => {
  const body = JSON.stringify({ transaction_id: "abcdef", additional_data: "x" .repeat(MAX_ONEPAY_CALLBACK_BYTES) });
  const request = callbackRequest(body, { "content-length": "1" });
  assert.deepEqual(await readOnePayCallback(request), { ok: false, status: 413 });
});

test("a confirmed payment creates the order and then runs cleanup", async () => {
  const order = { invoiceNumber: "INV-20261024-0001" };
  const calls = [];
  const result = await runPaymentFinalization({
    requestId: "request-1",
    phone: "0771234567",
    confirmPayment: async () => true,
    isRetryableConfirmationError: () => false,
    createOrder: async () => ({ ok: true, order }),
    onPaidUnplaced: async () => calls.push("alert"),
    onPlaced: async () => calls.push("cleanup"),
  });
  assert.deepEqual(result, { kind: "placed", order, phone: "0771234567" });
  assert.deepEqual(calls, ["cleanup"]);
});

test("an unconfirmed payment does not create an order", async () => {
  let created = false;
  const result = await runPaymentFinalization({
    requestId: "request-1",
    phone: "0771234567",
    confirmPayment: async () => false,
    isRetryableConfirmationError: () => false,
    createOrder: async () => { created = true; return { ok: true, order: {} }; },
    onPaidUnplaced: async () => {},
    onPlaced: async () => {},
  });
  assert.deepEqual(result, { kind: "unpaid" });
  assert.equal(created, false);
});

test("a OnePay timeout stays retryable", async () => {
  const result = await runPaymentFinalization({
    requestId: "request-1",
    phone: "0771234567",
    confirmPayment: async () => { throw new Error("OnePay timeout"); },
    isRetryableConfirmationError: (error) => error instanceof Error && error.message.includes("timeout"),
    createOrder: async () => { throw new Error("must not be called"); },
    onPaidUnplaced: async () => {},
    onPlaced: async () => {},
  });
  assert.deepEqual(result, { kind: "retry" });
});

test("a POS failure after confirmed payment raises an alert and retains recoverable state", async () => {
  const calls = [];
  const result = await runPaymentFinalization({
    requestId: "request-1",
    phone: "0771234567",
    confirmPayment: async () => true,
    isRetryableConfirmationError: () => false,
    createOrder: async () => ({ ok: false, error: "POS unavailable" }),
    onPaidUnplaced: async (reason) => calls.push(`alert:${reason}`),
    onPlaced: async () => calls.push("cleanup"),
  });
  assert.deepEqual(result, { kind: "paid-unplaced", requestId: "request-1" });
  assert.deepEqual(calls, ["alert:POS unavailable"]);
});

test("a failed alert attempt does not clear pending payment state", async () => {
  let cleanup = false;
  const result = await runPaymentFinalization({
    requestId: "request-1",
    phone: "0771234567",
    confirmPayment: async () => true,
    isRetryableConfirmationError: () => false,
    createOrder: async () => ({ ok: false, error: "POS unavailable" }),
    onPaidUnplaced: async () => { throw new Error("alert service unavailable"); },
    onPlaced: async () => { cleanup = true; },
  });
  assert.deepEqual(result, { kind: "paid-unplaced", requestId: "request-1" });
  assert.equal(cleanup, false);
});
