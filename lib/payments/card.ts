import "server-only";
import { cookies } from "next/headers";
import type { OrderSummary } from "@/lib/orders/actions";
import { submitToPos, type Identity, type OrderFields } from "@/lib/orders/place";
import { isPaid, OnePayError } from "@/lib/payments/onepay";
import { PosError, posRequest } from "@/lib/pos/client";
import { open, seal } from "@/lib/payments/vault";
import { runPaymentFinalization } from "@/lib/payments/finalize-core";

/**
 * Card-payment state. The order is created in the POS only after OnePay itself
 * confirms the payment, so the checkout details wait, sealed (see vault.ts), in
 * the customer's cookie and in OnePay's pass-through field for the webhook.
 */

/** Sealed order details: everything needed to create the order once it is paid. */
export type PendingCardOrder = {
  requestId: string;
  /** Total charged, LKR. */
  amount: number;
  deliveryFee: number;
  /** [POS barcode, quantity] pairs (kept short: this rides in a cookie). */
  items: [string, number][];
  identity: Identity;
  customer: Omit<OrderFields, "requestId" | "items" | "website">;
};

export const PENDING_TTL_SECONDS = 2 * 60 * 60;
const PENDING_COOKIE = "mynix_card_pending";
const TXN_COOKIE = "mynix_card_txn";
const RECEIPT_COOKIE = "mynix_card_receipt";

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const, // must come back on OnePay's redirect to this site
  path: "/",
  maxAge,
});

export const sealPending = (pending: PendingCardOrder) => seal(pending, PENDING_TTL_SECONDS);

/** Only in Server Actions / Route Handlers. */
export async function rememberPending(sealedPending: string, transactionId: string) {
  const jar = await cookies();
  jar.set(PENDING_COOKIE, sealedPending, cookieOptions(PENDING_TTL_SECONDS));
  jar.set(TXN_COOKIE, seal({ transactionId }, PENDING_TTL_SECONDS), cookieOptions(PENDING_TTL_SECONDS));
}

export async function readPending(): Promise<{ pending: PendingCardOrder; transactionId: string } | null> {
  const jar = await cookies();
  const pending = open<PendingCardOrder>(jar.get(PENDING_COOKIE)?.value);
  const txn = open<{ transactionId: string }>(jar.get(TXN_COOKIE)?.value);
  return pending && txn ? { pending, transactionId: txn.transactionId } : null;
}

export async function clearPending() {
  const jar = await cookies();
  jar.delete(PENDING_COOKIE);
  jar.delete(TXN_COOKIE);
}

/** Lets the confirmation page show the order that was just paid for (30 minutes). */
export async function rememberReceipt(invoiceNumber: string, phone: string) {
  (await cookies()).set(RECEIPT_COOKIE, seal({ invoiceNumber, phone }, 30 * 60), cookieOptions(30 * 60));
}

export async function readReceipt(): Promise<{ invoiceNumber: string; phone: string } | null> {
  return open<{ invoiceNumber: string; phone: string }>((await cookies()).get(RECEIPT_COOKIE)?.value);
}

/**
 * The sealed order is also parked in the POS under the OnePay transaction id.
 * OnePay's webhook carries only that id (it does not echo our extra data), so this
 * is how the webhook finds the order to create when the customer never returns.
 */
const isTransactionId = (value: string) => /^[A-Za-z0-9_-]{6,64}$/.test(value);

export async function parkPending(transactionId: string, sealedPending: string) {
  await posRequest(`/store/pending-payments/${transactionId}`, { method: "PUT", body: { sealedOrder: sealedPending } });
}

export async function findParkedPending(transactionId: string): Promise<PendingCardOrder | null> {
  if (!isTransactionId(transactionId)) return null;
  try {
    const { sealedOrder } = await posRequest<{ sealedOrder: string }>(`/store/pending-payments/${transactionId}`);
    return open<PendingCardOrder>(sealedOrder);
  } catch (error) {
    if (error instanceof PosError && error.status === 404) return null;
    throw error;
  }
}

/** Holds the cart's items for this payment (30 minutes) so nobody else can buy them meanwhile. */
export async function holdStock(requestId: string, items: [string, number][]): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await posRequest("/store/reservations", {
      method: "POST",
      body: { requestId, items: items.map(([barcode, quantity]) => ({ barcode, quantity })) },
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof PosError && error.status === 400) {
      return { ok: false, error: /^Only \d+ /.test(error.message) ? error.message : "Sorry — an item just sold out. Please review your cart." };
    }
    console.error("[payments] Holding stock failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "The shop is temporarily unavailable. Please try again shortly." };
  }
}

/** Gives the hold back (the payment never started). Best effort: it expires by itself anyway. */
export async function releaseStock(requestId: string) {
  await posRequest(`/store/reservations/${requestId}`, { method: "DELETE" }).catch(() => undefined);
}

/** Tells the shop (SMS + a banner in the POS) that a customer paid but no order exists. Once per transaction. */
async function raisePaymentAlert(pending: PendingCardOrder, transactionId: string, reason: string) {
  try {
    await posRequest("/store/payment-alerts", {
      method: "POST",
      body: {
        transactionId,
        requestId: pending.requestId,
        amount: pending.amount,
        customerName: pending.customer.customerName,
        customerPhone: pending.customer.customerPhone,
        reason,
      },
    });
  } catch (error) {
    // The POS itself is unreachable: the server log is the only trail left.
    console.error("[payments] COULD NOT RAISE THE PAID-BUT-NOT-PLACED ALERT:", error instanceof Error ? error.message : error);
  }
}

/** The order was placed after all (e.g. a retry): close any alert for it. */
async function closePaymentAlert(transactionId: string) {
  await posRequest(`/store/payment-alerts/${transactionId}`, { method: "DELETE" }).catch(() => undefined);
}

async function unparkPending(transactionId: string) {
  await posRequest(`/store/pending-payments/${transactionId}`, { method: "DELETE" }).catch(() => undefined);
}

export type FinalizeResult =
  | { kind: "placed"; order: OrderSummary; phone: string }
  /** OnePay does not (yet) confirm a payment: cancelled, failed or still processing. */
  | { kind: "unpaid" }
  /** Paid, but the order could not be created: needs a human. */
  | { kind: "paid-unplaced"; requestId: string }
  /** OnePay couldn't be reached: safe to try again. */
  | { kind: "retry" };

/**
 * Confirms the payment with OnePay and creates the order. Safe to run any number
 * of times for the same payment (return page and webhook both call it): the POS
 * returns the existing order for a repeated request id, and refuses a payment
 * reference it has already recorded.
 */
export async function finalizeCardPayment(pending: PendingCardOrder, transactionId: string): Promise<FinalizeResult> {
  return runPaymentFinalization({
    requestId: pending.requestId,
    phone: pending.customer.customerPhone,
    confirmPayment: () => isPaid(transactionId, pending.amount),
    isRetryableConfirmationError: (error) => {
      if (!(error instanceof OnePayError)) return false;
      console.error("[payments] Could not confirm the payment with OnePay:", error.message);
      return true;
    },
    createOrder: () => submitToPos({
      requestId: pending.requestId,
      identity: pending.identity,
      items: pending.items.map(([barcode, quantity]) => ({ barcode, quantity })),
      deliveryFee: pending.deliveryFee,
      paymentMethod: "ONLINE",
      paymentReference: transactionId,
      customer: pending.customer,
    }),
    onPaidUnplaced: async (reason) => {
      // Keep the POS pending-payment record; a retry can place the order later.
      console.error(
        `[payments] PAID BUT ORDER NOT PLACED: request ${pending.requestId}, OnePay transaction ${transactionId}, ` +
          `LKR ${pending.amount.toFixed(2)}. Reason: ${reason}`,
      );
      await raisePaymentAlert(pending, transactionId, reason);
    },
    onPlaced: async (order) => {
      if (Math.abs(order.grandTotal - pending.amount) >= 0.005) {
        console.error(
          `[payments] AMOUNT MISMATCH: ${order.invoiceNumber} is LKR ${order.grandTotal} in the POS ` +
            `but the customer paid LKR ${pending.amount.toFixed(2)} (OnePay transaction ${transactionId}).`,
        );
      }
      await Promise.all([unparkPending(transactionId), closePaymentAlert(transactionId)]);
    },
  });
}
