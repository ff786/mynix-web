"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { CATALOG_TAG, getCatalogEntries } from "@/lib/catalog";
import { clearVerification, getCustomerSession, getVerification } from "@/lib/customer/session";
import { deliveryFee } from "@/lib/orders/config";
import { mobileSchema } from "@/lib/phone";
import { PosError, posRequest } from "@/lib/pos/client";
import { limited, visitorKey } from "@/lib/rate-limit";

/**
 * Checkout and order tracking. The browser only sends website product ids and
 * quantities; this server maps them to POS products and the POS prices the
 * order from its own database. Browsers never learn POS identifiers.
 */

export type OrderLine = { name: string; quantity: number; unitPrice: number; lineTotal: number };
export type OrderSummary = {
  invoiceNumber: string;
  status: "PLACED" | "PACKED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  paymentMethod: "CASH_ON_DELIVERY" | "CARD" | "BANK_TRANSFER";
  items: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  customerName: string;
  city: string;
  district: string;
  placedAt: string;
};
export type ActionResult = { ok: true; order: OrderSummary } | { ok: false; error: string };

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

const checkoutSchema = z.object({
  requestId: z.uuid(),
  items: z
    .array(z.object({ id: z.string().min(1).max(100), quantity: z.number().int().min(1).max(50) }))
    .min(1, "Your cart is empty.")
    .max(30),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "CARD"]),
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

export type CheckoutInput = z.input<typeof checkoutSchema>;

export async function placeOrder(input: CheckoutInput): Promise<ActionResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const order = parsed.data;

  if (order.paymentMethod === "CARD") {
    return { ok: false, error: "Card payment is coming soon. Please choose cash on delivery." };
  }

  // Who is ordering: a signed-in customer (their number is fixed), or a guest
  // who verified this number by SMS code in this browser.
  const session = await getCustomerSession();
  let identity: { customerId: number } | { verificationToken: string };
  if (session) {
    order.customerPhone = session.phone;
    identity = { customerId: session.customerId };
  } else {
    const verification = await getVerification("CHECKOUT");
    if (!verification || verification.phone !== order.customerPhone) {
      return { ok: false, error: "Please verify your mobile number with the SMS code first." };
    }
    identity = { verificationToken: verification.token };
  }

  const visitor = await visitorKey();
  if (limited(`order:${visitor}`, 5, 30) || limited(`order-phone:${order.customerPhone}`, 3, 30)) {
    return { ok: false, error: "Too many orders in a short time. Please try again later or contact us on WhatsApp." };
  }

  // Map website ids to POS products and check availability.
  const catalog = await getCatalogEntries().catch(() => null);
  if (!catalog) return { ok: false, error: "The shop is temporarily unavailable. Please try again shortly." };
  const byId = new Map(catalog.map((entry) => [entry.product.id, entry]));

  const items: { barcode: string; quantity: number }[] = [];
  for (const line of order.items) {
    const entry = byId.get(line.id);
    if (!entry) return { ok: false, error: "An item in your cart is no longer available. Please review your cart." };
    if (!entry.product.inStock || line.quantity > entry.product.maxQuantity) {
      return { ok: false, error: `Only ${entry.product.maxQuantity} × ${entry.product.name} available right now.` };
    }
    items.push({ barcode: entry.barcode, quantity: line.quantity });
  }

  try {
    const placed = await posRequest<OrderSummary>("/store/orders", {
      method: "POST",
      body: {
        requestId: order.requestId,
        ...identity,
        items,
        paymentMethod: order.paymentMethod,
        deliveryFee: deliveryFee(),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail || undefined,
        addressLine1: order.addressLine1,
        addressLine2: order.addressLine2,
        city: order.city,
        district: order.district,
        postalCode: order.postalCode,
        deliveryNotes: order.deliveryNotes,
      },
    });
    updateTag(CATALOG_TAG); // availability changed
    if (!session) await clearVerification("CHECKOUT");
    return { ok: true, order: placed };
  } catch (error) {
    if (error instanceof PosError && error.status === 400 && /insufficient stock/i.test(error.message)) {
      updateTag(CATALOG_TAG);
      return { ok: false, error: "Sorry — an item just sold out. Please review your cart." };
    }
    console.error("[orders] Placing order failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "We couldn't place your order. Please try again or contact us on WhatsApp." };
  }
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
