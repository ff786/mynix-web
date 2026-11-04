import "server-only";
import { createHash } from "node:crypto";

/**
 * OnePay IPG (hosted card checkout), server-side only. The App ID and Hash Salt
 * never leave this server: browsers only ever receive OnePay's own payment-page
 * address. https://docs.onepay.lk/api-documentation/payment-api
 */
const APP_ID = process.env.ONEPAY_APP_ID ?? "";
const HASH_SALT = process.env.ONEPAY_HASH_SALT ?? "";
// Sent in the Authorization header of every request (OnePay merchant dashboard → the app's API Keys).
const APP_TOKEN = process.env.ONEPAY_APP_TOKEN?.trim() ?? "";
// Live by default; set ONEPAY_API_URL to the sandbox address from the merchant dashboard to test.
const API_URL = (process.env.ONEPAY_API_URL?.trim() || "https://api.onepay.lk").replace(/\/+$/, "");

export const isOnePayConfigured = Boolean(APP_ID && HASH_SALT && APP_TOKEN);

if (!/^https:\/\//.test(API_URL) && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(API_URL)) {
  throw new Error("ONEPAY_API_URL must use https.");
}

const CURRENCY = "LKR";

export class OnePayError extends Error {}

/** Amount with exactly two decimals, as OnePay hashes and expects it. */
export const formatAmount = (amount: number) => amount.toFixed(2);

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

async function call(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: APP_TOKEN },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new OnePayError("OnePay could not be reached");
  }
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !data) throw new OnePayError(`OnePay request failed (${res.status})`);
  return data;
}

/** OnePay answers {status: 200, message, data: {...}}: the details are inside `data`. */
const details = (reply: Record<string, unknown>): Record<string, unknown> =>
  reply.data && typeof reply.data === "object" ? (reply.data as Record<string, unknown>) : reply;

/** Only OnePay's own https pages are ever sent to the customer. */
function trustedRedirect(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host === "onepay.lk" || host.endsWith(".onepay.lk")) ? url.toString() : null;
  } catch {
    return null;
  }
}

export type CheckoutLinkRequest = {
  /** Our own short id for the order (OnePay allows at most 21 characters). */
  reference: string;
  amount: number;
  firstName: string;
  lastName: string;
  /** E.164, e.g. +94771234567. */
  phone: string;
  email: string;
  /** Where OnePay sends the customer afterwards (https). */
  returnUrl: string;
};

/** Starts a payment: returns OnePay's payment page and the transaction id. */
export async function createCheckoutLink(req: CheckoutLinkRequest): Promise<{ redirectUrl: string; transactionId: string }> {
  if (!isOnePayConfigured) throw new OnePayError("OnePay is not configured");
  const amount = formatAmount(req.amount);
  const data = await call("/v3/checkout/link/", {
    app_id: APP_ID,
    amount: Number(amount),
    currency: CURRENCY,
    hash: sha256(`${APP_ID}${CURRENCY}${amount}${HASH_SALT}`),
    reference: req.reference,
    customer_first_name: req.firstName,
    customer_last_name: req.lastName,
    customer_phone_number: req.phone,
    customer_email: req.email,
    transaction_redirect_url: req.returnUrl,
  });

  const info = details(data);
  const gateway = (info.gateway ?? info.redirect) as Record<string, unknown> | undefined;
  const redirectUrl = trustedRedirect(gateway?.redirect_url ?? info.redirect_url);
  const transactionId = info.ipg_transaction_id;
  if (!redirectUrl || typeof transactionId !== "string" || !transactionId) {
    throw new OnePayError("OnePay returned an unexpected answer");
  }
  return { redirectUrl, transactionId };
}

/** True only if OnePay itself confirms this transaction succeeded for exactly this amount. */
export async function isPaid(transactionId: string, expectedAmount: number): Promise<boolean> {
  if (!isOnePayConfigured || !/^[A-Za-z0-9_-]{6,64}$/.test(transactionId)) return false;
  const data = await call("/v3/transaction/status/", { app_id: APP_ID, onepay_transaction_id: transactionId });
  const info = details(data);
  const status = info.status;
  const amount = Number(info.amount);
  return (
    (status === true || status === 1 || status === "SUCCESS") &&
    info.currency === CURRENCY &&
    info.ipg_transaction_id === transactionId &&
    Number.isFinite(amount) &&
    Math.abs(amount - expectedAmount) < 0.005
  );
}
