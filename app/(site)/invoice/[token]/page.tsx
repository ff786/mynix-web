import type { Metadata } from "next";
import Link from "next/link";
import OrderSummaryCard from "@/components/orders/OrderSummaryCard";
import type { OrderSummary } from "@/lib/orders/actions";
import { posRequest } from "@/lib/pos/client";

export const metadata: Metadata = { title: "Your invoice", robots: { index: false, follow: false } };

/** Invoice link from the order SMS. Only website orders are shown here. */
export default async function InvoicePage({ params }: PageProps<"/invoice/[token]">) {
  const { token } = await params;
  const order = /^[a-f0-9]{32}$/.test(token)
    ? await posRequest<OrderSummary>(`/store/invoices/${token}`).catch(() => null)
    : null;

  return (
    <main data-theme="dark" data-section-bg="#050505" className="min-h-screen px-6 pb-24 pt-36 sm:px-10 sm:pt-44">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-semibold uppercase tracking-tighter text-white/90 sm:text-6xl">Invoice</h1>
        {order ? (
          <>
            <p className="mt-4 text-white/60">
              Placed{" "}
              {new Date(order.placedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}. Keep this
              page for your records.
            </p>
            <div className="mt-10">
              <OrderSummaryCard order={order} />
            </div>
          </>
        ) : (
          <p className="mt-6 text-white/60">
            This invoice link has expired or isn&apos;t valid. You can still{" "}
            <Link href="/track" className="underline underline-offset-4 hover:text-white">
              track your order
            </Link>{" "}
            with your order number and mobile number.
          </p>
        )}
      </div>
    </main>
  );
}
