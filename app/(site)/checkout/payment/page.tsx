import type { Metadata } from "next";
import Link from "next/link";
import ClearCartOnMount from "@/components/checkout/ClearCartOnMount";
import OrderSummaryCard from "@/components/orders/OrderSummaryCard";
import type { OrderSummary } from "@/lib/orders/actions";
import { readReceipt } from "@/lib/payments/card";
import { PosError, posRequest } from "@/lib/pos/client";
import { getWhatsAppGeneralUrl } from "@/utils/whatsapp";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false },
};

const link = "text-white/70 underline-offset-4 hover:text-white hover:underline";

type Notice = { eyebrow: string; title: string; body: string; action?: { href: string; label: string } };

const NOTICES: Record<string, Notice> = {
  failed: {
    eyebrow: "Payment not completed",
    title: "We haven't received your payment.",
    body: "The payment was cancelled or declined, or it may still be processing. No order is placed until it completes; if it does, we'll confirm it by SMS. Your cart is still saved. You can try again, or choose cash on delivery.",
    action: { href: "/checkout", label: "Back to checkout" },
  },
  retry: {
    eyebrow: "One moment",
    title: "We're still confirming your payment.",
    body: "We couldn't reach the payment provider just now. If your card was charged, your order will be confirmed automatically and you'll get an SMS. You can also contact us on WhatsApp.",
  },
  unknown: {
    eyebrow: "Payment status",
    title: "We couldn't find your checkout in this browser.",
    body: "If you paid, your order will be confirmed automatically and you'll get an SMS. If you were not charged, you can go back to checkout and try again.",
    action: { href: "/checkout", label: "Back to checkout" },
  },
};

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<{ state?: string; ref?: string }> }) {
  const { state, ref } = await searchParams;

  if (state === "paid") {
    const receipt = await readReceipt();
    let order: OrderSummary | null = null;
    if (receipt) {
      order = await posRequest<OrderSummary>(
        `/store/orders/${encodeURIComponent(receipt.invoiceNumber)}?phone=${encodeURIComponent(receipt.phone)}`,
      ).catch((error) => {
        if (!(error instanceof PosError)) console.error("[payments] Loading the paid order failed:", error);
        return null;
      });
    }
    return (
      <Shell>
        <ClearCartOnMount />
        <p className="text-xs uppercase tracking-[0.25em] text-white/45">Payment received</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white/90">Thank you, your order is placed.</h2>
        <p className="mt-3 text-white/60">
          Your payment went through. We&apos;ll call you to confirm delivery, and you&apos;ll get an SMS with your
          invoice. Keep your order number to track it.
        </p>
        {order && (
          <div className="mt-8">
            <OrderSummaryCard order={order} />
          </div>
        )}
        <div className="mt-8 flex gap-6 text-sm">
          <Link href="/track" className={link}>
            Track this order
          </Link>
          <Link href="/catalog" className={link}>
            Continue shopping
          </Link>
        </div>
      </Shell>
    );
  }

  if (state === "paid-unplaced") {
    const reference = (ref ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
    return (
      <Shell>
        <p className="text-xs uppercase tracking-[0.25em] text-white/45">Payment received</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white/90">We need to finish your order.</h2>
        <p className="mt-3 text-white/60">
          Your payment went through, but we couldn&apos;t complete the order automatically (an item may have just sold
          out). We&apos;ve been alerted. Please contact us and we&apos;ll sort it out or refund you in full.
        </p>
        {reference && (
          <p className="mt-4 text-sm text-white/60">
            Payment reference: <span className="font-mono text-white/90">{reference}</span>
          </p>
        )}
        <div className="mt-8 flex gap-6 text-sm">
          <a href={getWhatsAppGeneralUrl()} target="_blank" rel="noopener noreferrer" className={link}>
            Contact us on WhatsApp
          </a>
        </div>
      </Shell>
    );
  }

  const notice = NOTICES[state ?? ""] ?? NOTICES.unknown;
  return (
    <Shell>
      <p className="text-xs uppercase tracking-[0.25em] text-white/45">{notice.eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white/90">{notice.title}</h2>
      <p className="mt-3 text-white/60">{notice.body}</p>
      <div className="mt-8 flex gap-6 text-sm">
        {notice.action && (
          <Link href={notice.action.href} className={link}>
            {notice.action.label}
          </Link>
        )}
        <a href={getWhatsAppGeneralUrl()} target="_blank" rel="noopener noreferrer" className={link}>
          Contact us on WhatsApp
        </a>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main data-theme="dark" data-section-bg="#050505" className="min-h-dvh px-6 pb-24 pt-36 sm:px-10 sm:pt-44">
      <div className="mx-auto max-w-2xl">{children}</div>
    </main>
  );
}
