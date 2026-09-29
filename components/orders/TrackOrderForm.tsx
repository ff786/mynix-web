"use client";

import { useState, useTransition } from "react";
import OrderSummaryCard from "@/components/orders/OrderSummaryCard";
import { trackOrder, type OrderSummary } from "@/lib/orders/actions";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder:text-white/30 transition-colors focus:border-white/40 focus:outline-none";

export default function TrackOrderForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderSummary | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await trackOrder({
        invoiceNumber: String(form.get("invoiceNumber") ?? ""),
        phone: String(form.get("phone") ?? ""),
      });
      if (result.ok) setOrder(result.order);
      else {
        setOrder(null);
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="space-y-2 text-sm text-white/70">
          <span className="block">Order number</span>
          <input
            name="invoiceNumber"
            required
            placeholder="INV-20260928-0012"
            maxLength={24}
            pattern="\s*[Ii][Nn][Vv]-?[0-9]{8}-?[0-9]{1,6}\s*"
            title="Your order number looks like INV-20260928-0012."
            autoCapitalize="characters"
            className={inputClass}
          />
        </label>
        <label className="space-y-2 text-sm text-white/70">
          <span className="block">Mobile number</span>
          <input
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="077 123 4567"
            maxLength={20}
            pattern="[+]?[0-9 \-]{9,16}"
            title="Enter the Sri Lankan mobile number you ordered with, e.g. 077 123 4567."
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-white px-6 py-3.5 text-sm font-medium text-[#1d1d1f] disabled:opacity-60"
        >
          {pending ? "Checking…" : "Track"}
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {order && <OrderSummaryCard order={order} />}
    </div>
  );
}
