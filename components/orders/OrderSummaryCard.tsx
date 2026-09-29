import type { OrderSummary } from "@/lib/orders/actions";
import { formatLkr } from "@/utils/money";

const STATUS_TEXT: Record<OrderSummary["status"], string> = {
  PLACED: "Order placed — we'll call you to confirm delivery.",
  PACKED: "Packed and getting ready for delivery.",
  DISPATCHED: "On its way to you.",
  DELIVERED: "Delivered.",
  CANCELLED: "This order was cancelled. Contact us on WhatsApp if that's unexpected.",
};

/** Order details for the confirmation and tracking pages. */
export default function OrderSummaryCard({ order }: { order: OrderSummary }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">Order number</p>
        <p className="font-mono text-lg tracking-wider text-white/90">{order.invoiceNumber}</p>
      </div>
      <p className="mt-4 text-sm text-white/70">{STATUS_TEXT[order.status]}</p>

      {order.items.length > 0 && (
        <>
          <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {order.items.map((line) => (
              <li key={line.name} className="flex justify-between gap-4 py-3 text-sm">
                <span className="text-white/80">
                  {line.name} <span className="text-white/40">× {line.quantity}</span>
                </span>
                <span className="tabular-nums text-white/80">{formatLkr(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-white/60">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatLkr(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-white/60">
              <dt>Delivery</dt>
              <dd className="tabular-nums">{order.deliveryFee > 0 ? formatLkr(order.deliveryFee) : "Free"}</dd>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold text-white/90">
              <dt>
                {order.paymentMethod === "CARD"
                  ? "Paid by card"
                  : order.paymentMethod === "BANK_TRANSFER"
                    ? "Paid by bank transfer"
                    : "Pay on delivery"}
              </dt>
              <dd className="tabular-nums">{formatLkr(order.grandTotal)}</dd>
            </div>
          </dl>
        </>
      )}

      <p className="mt-6 text-xs text-white/40">
        Delivering to {order.customerName}, {order.city}, {order.district}.
      </p>
    </div>
  );
}
