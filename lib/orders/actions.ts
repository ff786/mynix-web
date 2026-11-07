"use server";

import { z } from "zod";
import { clearVerification } from "@/lib/customer/session";
import { deliveryFee } from "@/lib/orders/config";
import { orderFieldsSchema, priceCart, resolveIdentity, submitToPos } from "@/lib/orders/place";
import { mobileSchema } from "@/lib/phone";
import { PosError, posRequest } from "@/lib/pos/client";
import { limited, visitorKey } from "@/lib/rate-limit";
import { formatLkr, meetsMinimumOrder, MIN_ORDER_LKR } from "@/utils/money";

/**
 * Checkout and order tracking. The browser only sends website product ids and
 * quantities; this server maps them to POS products and the POS prices the
 * order from its own database. Browsers never learn POS identifiers.
 */

export type OrderLine = { name: string; quantity: number; unitPrice: number; lineTotal: number };
export type OrderSummary = {
  invoiceNumber: string;
  status: "PLACED" | "PACKED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  paymentMethod: "CASH_ON_DELIVERY" | "ONLINE" | "BANK_TRANSFER";
  items: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  customerName: string;
  city: string;
  district: string;
  placedAt: string;
};
/** `detail` is the POS's own reason, for staff alerts and logs; never shown to customers. */
export type ActionResult = { ok: true; order: OrderSummary } | { ok: false; error: string; detail?: string };

const checkoutSchema = orderFieldsSchema.extend({ paymentMethod: z.literal("CASH_ON_DELIVERY") });

export type CheckoutInput = z.input<typeof checkoutSchema>;

/** Cash on delivery. Card payments go through startCardPayment and are placed only once paid. */
export async function placeOrder(input: CheckoutInput): Promise<ActionResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const { paymentMethod, requestId, items, website: _website, ...customer } = parsed.data;
  void _website;

  const who = await resolveIdentity(parsed.data);
  if (!who.ok) return who;
  customer.customerPhone = parsed.data.customerPhone; // may have been fixed to the account's number

  const visitor = await visitorKey();
  if (limited(`order:${visitor}`, 5, 30) || limited(`order-phone:${customer.customerPhone}`, 3, 30)) {
    return { ok: false, error: "Too many orders in a short time. Please try again later or contact us on WhatsApp." };
  }

  const cart = await priceCart(items);
  if (!cart.ok) return cart;
  if (!meetsMinimumOrder(cart.subtotal + deliveryFee())) {
    return { ok: false, error: `The minimum order is ${formatLkr(MIN_ORDER_LKR)}.` };
  }

  const result = await submitToPos({
    requestId,
    identity: who.identity,
    items: cart.items,
    deliveryFee: deliveryFee(),
    paymentMethod,
    customer,
  });
  if (result.ok && !who.signedIn) await clearVerification("CHECKOUT");
  return result;
}

const trackSchema = z.object({
  invoiceNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^INV-[0-9]{8}-[0-9]{1,6}$/, "Enter the order number from your confirmation, e.g. INV-20260928-0012."),
  phone: mobileSchema,
});

export async function trackOrder(input: z.input<typeof trackSchema>): Promise<ActionResult> {
  const parsed = trackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details." };

  if (limited(`track:${await visitorKey()}`, 20, 10)) {
    return { ok: false, error: "Too many attempts. Please try again in a few minutes." };
  }

  try {
    const { invoiceNumber, phone } = parsed.data;
    const order = await posRequest<OrderSummary>(
      `/store/orders/${encodeURIComponent(invoiceNumber)}?phone=${encodeURIComponent(phone)}`,
    );
    return { ok: true, order };
  } catch (error) {
    if (error instanceof PosError && (error.status === 404 || error.status === 400)) {
      return { ok: false, error: "We couldn't find an order with that number and mobile number." };
    }
    console.error("[orders] Tracking failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "Order tracking is temporarily unavailable." };
  }
}
