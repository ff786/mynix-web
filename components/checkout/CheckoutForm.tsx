"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { useCartLines } from "@/components/cart/CartView";
import PhoneVerifier from "@/components/customer/PhoneVerifier";
import OrderSummaryCard from "@/components/orders/OrderSummaryCard";
import { placeOrder, type OrderSummary } from "@/lib/orders/actions";
import type { Product } from "@/types/product";
import { cn } from "@/utils/cn";
import { formatLkr } from "@/utils/money";

const DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", "Hambantota", "Jaffna",
  "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala",
  "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder:text-white/30 transition-colors focus:border-white/40 focus:outline-none";

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm text-white/70">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  );
}

type CheckoutFormProps = {
  products: Product[];
  deliveryFee: number;
  /** Signed-in customer: their number is already verified. */
  customer: { name: string; phone: string } | null;
};

export default function CheckoutForm({ products, deliveryFee, customer }: CheckoutFormProps) {
  const { ready, clear } = useCart();
  const { valid, subtotal, hasProblems } = useCartLines(products);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<OrderSummary | null>(null);
  // One id per checkout: a retry after a network error can't create a second order.
  const requestId = useRef<string | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const phone = customer?.phone ?? verifiedPhone;

  if (placed) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-white/45">Thank you</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white/90">Your order is placed.</h2>
        <p className="mt-3 text-white/60">
          We&apos;ll call you to confirm delivery. You&apos;ll also get an SMS with your invoice. Keep your order
          number to track it.
        </p>
        <div className="mt-8">
          <OrderSummaryCard order={placed} />
        </div>
        <div className="mt-8 flex gap-6 text-sm">
          <Link href="/track" className="text-white/70 underline-offset-4 hover:text-white hover:underline">
            Track this order
          </Link>
          <Link href="/catalog" className="text-white/70 underline-offset-4 hover:text-white hover:underline">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!ready) return <div className="h-40" aria-hidden />;

  if (valid.length === 0 || hasProblems) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center">
        <p className="text-lg font-semibold text-white/80">
          {valid.length === 0 ? "Your cart is empty." : "Some items in your cart need attention."}
        </p>
        <Link href={valid.length === 0 ? "/catalog" : "/cart"} className="mt-4 inline-block text-white/70 underline underline-offset-4">
          {valid.length === 0 ? "Browse the catalog" : "Review your cart"}
        </Link>
      </div>
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "");
    requestId.current ??= crypto.randomUUID();

    setError(null);
    startTransition(async () => {
      const result = await placeOrder({
        requestId: requestId.current!,
        items: valid.map(({ line }) => ({ id: line.id, quantity: line.quantity })),
        paymentMethod: "CASH_ON_DELIVERY",
        customerName: value("customerName"),
        customerPhone: phone ?? "",
        customerEmail: value("customerEmail"),
        addressLine1: value("addressLine1"),
        addressLine2: value("addressLine2"),
        city: value("city"),
        district: value("district"),
        postalCode: value("postalCode"),
        deliveryNotes: value("deliveryNotes"),
        website: value("website"),
      });
      if (result.ok) {
        clear();
        setPlaced(result.order);
        window.scrollTo({ top: 0 });
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-12 lg:grid-cols-[1fr_380px]">
      <div className="space-y-10">
        <fieldset className="space-y-5">
          <legend className="mb-5 text-xs uppercase tracking-[0.25em] text-white/45">Contact</legend>
          <Field label="Full name" htmlFor="customerName">
            <input
              id="customerName"
              name="customerName"
              required
              maxLength={150}
              autoComplete="name"
              defaultValue={customer?.name}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-white/70">Mobile number</p>
              {customer ? (
                <p className="rounded-xl border border-white/10 px-4 py-3 text-[15px] text-white/80">
                  {customer.phone} <span className="text-xs text-white/40">· signed in</span>
                </p>
              ) : (
                <>
                  <PhoneVerifier
                    purpose="CHECKOUT"
                    inputClassName={inputClass}
                    onVerified={(result) => setVerifiedPhone(result.phone)}
                    onReset={() => setVerifiedPhone(null)}
                  />
                  <p className="text-xs text-white/40">
                    We verify your number by SMS, call to confirm delivery and SMS your invoice.{" "}
                    <Link href="/account?next=/checkout" className="underline underline-offset-4 hover:text-white">
                      Have an account? Sign in
                    </Link>
                  </p>
                </>
              )}
            </div>
            <Field label="Email (optional)" htmlFor="customerEmail">
              <input id="customerEmail" name="customerEmail" type="email" maxLength={254} autoComplete="email" className={inputClass} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-5 text-xs uppercase tracking-[0.25em] text-white/45">Delivery address</legend>
          <Field label="Address" htmlFor="addressLine1">
            <input id="addressLine1" name="addressLine1" required maxLength={200} autoComplete="address-line1" className={inputClass} />
          </Field>
          <Field label="Apartment, landmark (optional)" htmlFor="addressLine2">
            <input id="addressLine2" name="addressLine2" maxLength={200} autoComplete="address-line2" className={inputClass} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="City" htmlFor="city">
              <input id="city" name="city" required maxLength={100} autoComplete="address-level2" className={inputClass} />
            </Field>
            <Field label="District" htmlFor="district">
              <select id="district" name="district" required defaultValue="" className={cn(inputClass, "appearance-none")}>
                <option value="" disabled>
                  Choose…
                </option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Postal code (optional)" htmlFor="postalCode">
              <input id="postalCode" name="postalCode" maxLength={20} autoComplete="postal-code" className={inputClass} />
            </Field>
          </div>
          <Field label="Delivery notes (optional)" htmlFor="deliveryNotes">
            <textarea id="deliveryNotes" name="deliveryNotes" rows={3} maxLength={500} className={inputClass} />
          </Field>
        </fieldset>

        <fieldset>
          <legend className="mb-5 text-xs uppercase tracking-[0.25em] text-white/45">Payment</legend>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/40 bg-white/[0.04] p-4">
              <input type="radio" name="paymentMethod" value="CASH_ON_DELIVERY" defaultChecked className="accent-white" />
              <span>
                <span className="block text-sm font-medium text-white/90">Cash on delivery</span>
                <span className="block text-xs text-white/50">Pay the courier when your order arrives.</span>
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 p-4 opacity-50">
              <input type="radio" name="paymentMethod" value="CARD" disabled />
              <span>
                <span className="block text-sm font-medium text-white/90">Card payment (OnePay)</span>
                <span className="block text-xs text-white/50">Coming soon.</span>
              </span>
            </label>
          </div>
        </fieldset>

        {/* Honeypot: hidden from people, filled in by bots. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      </div>

      <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:sticky lg:top-28">
        <p className="text-xs uppercase tracking-[0.25em] text-white/45">Your order</p>
        <ul className="mt-4 space-y-3 text-sm">
          {valid.map(({ line, product }) => (
            <li key={line.id} className="flex justify-between gap-4">
              <span className="text-white/75">
                {product.name} <span className="text-white/40">× {line.quantity}</span>
              </span>
              <span className="tabular-nums text-white/75">{formatLkr(product.price * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-white/60">
            <dt>Delivery</dt>
            <dd className="tabular-nums">{deliveryFee > 0 ? formatLkr(deliveryFee) : "Free"}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold text-white/90">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatLkr(subtotal + deliveryFee)}</dd>
          </div>
        </dl>

        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {!phone && (
          <p className="mt-5 text-sm text-white/55">Verify your mobile number to place the order.</p>
        )}
        <button
          type="submit"
          disabled={pending || !phone}
          className="mt-6 w-full rounded-full bg-white py-3.5 text-sm font-medium text-[#1d1d1f] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Placing order…" : "Place order"}
        </button>
        <p className="mt-3 text-center text-xs text-white/40">Prices and stock are confirmed when you place the order.</p>
      </aside>
    </form>
  );
}
