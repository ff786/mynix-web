"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { z } from "zod";
import { CATALOG_TAG, getCatalogEntries } from "@/lib/catalog";
import { deliveryFee } from "@/lib/orders/config";
import { PosError, posRequest } from "@/lib/pos/client";

/**
 * Checkout and order tracking. The browser only sends website product ids and
 * quantities; this server maps them to POS products and the POS prices the
 * order from its own database. Browsers never learn POS identifiers.
 */

export type OrderLine = { name: string; quantity: number; unitPrice: number; lineTotal: number };
export type OrderSummary = {
  invoiceNumber: string;
  status: "PLACED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  paymentMethod: "CASH_ON_DELIVERY" | "CARD";
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

const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^0-9]/g, ""))
  .transform((d) => (d.length === 11 && d.startsWith("947") ? `0${d.slice(2)}` : d.length === 9 && d.startsWith("7") ? `0${d}` : d))
  .refine((d) => /^07[0-9]{8}$/.test(d), "Enter a Sri Lankan mobile number, e.g. 077 123 4567.");

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
  customerPhone: phoneSchema,
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
  phone: phoneSchema,
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

// --- rate limiting -------------------------------------------------------------
// Per server instance: a first line of defence against scripted orders. COD
// orders reserve stock, so a shared limit (e.g. Redis) should replace this
// before heavy traffic.

const hits = new Map<string, number[]>();

function limited(key: string, max: number, minutes: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < minutes * 60_000);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

async function visitorKey(): Promise<string> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(`mynix:${ip}`).digest("hex").slice(0, 32);
}
