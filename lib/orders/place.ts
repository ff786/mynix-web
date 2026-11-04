import "server-only";
import { revalidateTag, updateTag } from "next/cache";
import { z } from "zod";
import { CATALOG_TAG, getCatalogEntries } from "@/lib/catalog";
import { getCustomerSession, getVerification } from "@/lib/customer/session";
import type { ActionResult, OrderSummary } from "@/lib/orders/actions";
import { mobileSchema } from "@/lib/phone";
import { PosError, posRequest } from "@/lib/pos/client";

/**
 * The parts of placing an order shared by cash on delivery and card payment:
 * who is ordering, what the cart costs, and the call that creates the order in
 * the POS. Server-only; nothing here reaches browsers.
 */

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

/** What the checkout form sends, whatever the payment method. */
export const orderFieldsSchema = z.object({
  requestId: z.uuid(),
  items: z
    .array(z.object({ id: z.string().min(1).max(100), quantity: z.number().int().min(1).max(50) }))
    .min(1, "Your cart is empty.")
    .max(30),
  customerName: text(150),
  customerPhone: mobileSchema,
  customerEmail: z.union([z.email().max(254), z.literal("")]).optional(),
  addressLine1: text(200),
  addressLine2: optionalText(200),
  city: text(100),
  district: text(100),
  postalCode: optionalText(20),
  deliveryNotes: optionalText(500),
  /** Honeypot: hidden from people, filled by bots. */
  website: z.string().max(0).optional(),
});
export type OrderFields = z.output<typeof orderFieldsSchema>;

export type Identity = { customerId: number } | { verificationToken: string };

/**
 * Who is ordering: a signed-in customer (their number is fixed), or a guest who
 * verified this number by SMS code in this browser.
 */
export async function resolveIdentity(
  order: OrderFields,
): Promise<{ ok: true; identity: Identity; signedIn: boolean } | { ok: false; error: string }> {
  const session = await getCustomerSession();
  if (session) {
    order.customerPhone = session.phone;
    return { ok: true, identity: { customerId: session.customerId }, signedIn: true };
  }
  const verification = await getVerification("CHECKOUT");
  if (!verification || verification.phone !== order.customerPhone) {
    return { ok: false, error: "Please verify your mobile number with the SMS code first." };
  }
  return { ok: true, identity: { verificationToken: verification.token }, signedIn: false };
}

export type PricedCart = { items: { barcode: string; quantity: number }[]; subtotal: number };

/** Maps website ids to POS products, checks availability and prices the cart from the POS catalogue. */
export async function priceCart(
  lines: OrderFields["items"],
): Promise<({ ok: true } & PricedCart) | { ok: false; error: string }> {
  const catalog = await getCatalogEntries().catch(() => null);
  if (!catalog) return { ok: false, error: "The shop is temporarily unavailable. Please try again shortly." };
  const byId = new Map(catalog.map((entry) => [entry.product.id, entry]));

  const items: PricedCart["items"] = [];
  let subtotal = 0;
  for (const line of lines) {
    const entry = byId.get(line.id);
    if (!entry) return { ok: false, error: "An item in your cart is no longer available. Please review your cart." };
    if (!entry.product.inStock || line.quantity > entry.product.maxQuantity) {
      return { ok: false, error: `Only ${entry.product.maxQuantity} × ${entry.product.name} available right now.` };
    }
    items.push({ barcode: entry.barcode, quantity: line.quantity });
    subtotal += entry.product.price * line.quantity;
  }
  return { ok: true, items, subtotal };
}

export type PosOrder = {
  requestId: string;
  identity: Identity;
  items: PricedCart["items"];
  deliveryFee: number;
  paymentMethod: "CASH_ON_DELIVERY" | "ONLINE";
  /** OnePay transaction id: required for ONLINE, only after the payment is verified. */
  paymentReference?: string;
  customer: Omit<OrderFields, "requestId" | "items" | "website">;
};

/**
 * Availability changed: refresh the cached catalogue. updateTag only works inside a Server Action;
 * route handlers (the payment webhook and return page) use revalidateTag. Never fails the order.
 */
function refreshCatalog() {
  try {
    updateTag(CATALOG_TAG);
  } catch {
    try {
      revalidateTag(CATALOG_TAG, { expire: 0 });
    } catch {
      // The catalogue refreshes itself within a minute anyway.
    }
  }
}

/** Creates the order in the POS (which prices it from its own database). */
export async function submitToPos(order: PosOrder): Promise<ActionResult> {
  const { customer } = order;
  try {
    const placed = await posRequest<OrderSummary>("/store/orders", {
      method: "POST",
      body: {
        requestId: order.requestId,
        ...order.identity,
        items: order.items,
        paymentMethod: order.paymentMethod,
        paymentReference: order.paymentReference,
        deliveryFee: order.deliveryFee,
        customerName: customer.customerName,
        customerPhone: customer.customerPhone,
        customerEmail: customer.customerEmail || undefined,
        addressLine1: customer.addressLine1,
        addressLine2: customer.addressLine2,
        city: customer.city,
        district: customer.district,
        postalCode: customer.postalCode,
        deliveryNotes: customer.deliveryNotes,
      },
    });
    refreshCatalog();
    return { ok: true, order: placed };
  } catch (error) {
    if (error instanceof PosError && error.status === 400 && /insufficient stock/i.test(error.message)) {
      refreshCatalog();
      return { ok: false, error: "Sorry — an item just sold out. Please review your cart.", detail: error.message.slice(0, 200) };
    }
    console.error("[orders] Placing order failed:", error instanceof Error ? error.message : error);
    return {
      ok: false,
      error: "We couldn't place your order. Please try again or contact us on WhatsApp.",
      detail: (error instanceof Error ? error.message : "unknown error").slice(0, 200),
    };
  }
}
