"use server";

import { deliveryFee } from "@/lib/orders/config";
import { orderFieldsSchema, priceCart, resolveIdentity } from "@/lib/orders/place";
import { holdStock, parkPending, releaseStock, rememberPending, sealPending, type PendingCardOrder } from "@/lib/payments/card";
import { canStartOnePayPayments, createCheckoutLink, OnePayError } from "@/lib/payments/onepay";
import { vaultEnabled } from "@/lib/payments/vault";
import { limited, visitorKey } from "@/lib/rate-limit";
import { SITE_URL, SITE_URL_IS_SECURE } from "@/lib/site";
import { formatLkr, meetsMinimumOrder, MIN_ORDER_LKR } from "@/utils/money";
import { CONTACT_EMAIL } from "@/utils/whatsapp";

/** Cookies stop around 4 KB; keep the sealed order well inside that. */
const MAX_SEALED_LENGTH = 3_400;

/** OnePay accepts at most 21 characters for our reference: "MX" + the first 19 hex digits of the request id. */
const onePayReference = (requestId: string) => `MX${requestId.replace(/-/g, "").slice(0, 19)}`;

export type StartCardResult = { ok: true; redirectUrl: string } | { ok: false; error: string };

/**
 * Starts a card payment: prices the cart on the server, asks OnePay for a
 * payment page and returns only that page's address. Nothing is ordered yet;
 * the order is created once OnePay confirms the payment.
 */
export async function startCardPayment(input: unknown): Promise<StartCardResult> {
  if (!canStartOnePayPayments || !vaultEnabled || !SITE_URL_IS_SECURE) {
    return { ok: false, error: "Card payment isn't available right now. Please choose cash on delivery." };
  }

  const parsed = orderFieldsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const { requestId, items, website: _website, ...customer } = parsed.data;
  void _website;

  const who = await resolveIdentity(parsed.data);
  if (!who.ok) return who;
  customer.customerPhone = parsed.data.customerPhone; // fixed to the account's number when signed in

  const visitor = await visitorKey();
  if (limited(`card:${visitor}`, 6, 30) || limited(`card-phone:${customer.customerPhone}`, 4, 30)) {
    return { ok: false, error: "Too many attempts in a short time. Please try again later or contact us on WhatsApp." };
  }

  // The amount is decided here, from the POS catalogue: never taken from the browser.
  const cart = await priceCart(items);
  if (!cart.ok) return cart;
  const fee = deliveryFee();
  const amount = Math.round((cart.subtotal + fee) * 100) / 100;
  if (!(amount > 0)) return { ok: false, error: "Your cart total is invalid. Please review your cart." };
  if (!meetsMinimumOrder(amount)) return { ok: false, error: `The minimum order is ${formatLkr(MIN_ORDER_LKR)}.` };

  const pending: PendingCardOrder = {
    requestId,
    amount,
    deliveryFee: fee,
    items: cart.items.map(({ barcode, quantity }) => [barcode, quantity]),
    identity: who.identity,
    customer,
  };
  const sealed = sealPending(pending);
  if (sealed.length > MAX_SEALED_LENGTH) {
    return { ok: false, error: "This order is too large to pay by card. Please use cash on delivery or contact us." };
  }

  // Hold the items for 30 minutes so nobody else can buy them while this customer pays.
  const held = await holdStock(requestId, pending.items);
  if (!held.ok) return { ok: false, error: held.error };

  const [firstName, ...rest] = customer.customerName.split(/\s+/);
  try {
    const link = await createCheckoutLink({
      reference: onePayReference(requestId),
      amount,
      firstName,
      lastName: rest.join(" ") || "-",
      phone: `+94${customer.customerPhone.slice(1)}`,
      email: customer.customerEmail || CONTACT_EMAIL,
      returnUrl: `${SITE_URL}/api/onepay/return`,
    });
    // Found by the webhook if the customer never returns; if it can't be saved, don't send them to pay.
    await parkPending(link.transactionId, sealed);
    await rememberPending(sealed, link.transactionId);
    return { ok: true, redirectUrl: link.redirectUrl };
  } catch (error) {
    console.error("[payments] Starting the card payment failed:", error instanceof OnePayError ? error.message : error);
    await releaseStock(requestId); // the customer never reached the payment page
    return { ok: false, error: "We couldn't start the card payment. Please try again or choose cash on delivery." };
  }
}
