import type { Metadata } from "next";
import TrackOrderForm from "@/components/orders/TrackOrderForm";

export const metadata: Metadata = { title: "Track your order", robots: { index: false } };

export default function TrackPage() {
  return (
    <main data-theme="dark" data-section-bg="#050505" className="min-h-screen px-6 pb-24 pt-36 sm:px-10 sm:pt-44">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-semibold uppercase tracking-tighter text-white/90 sm:text-6xl">Track your order</h1>
        <p className="mt-4 text-white/60">Enter the order number from your confirmation and the mobile number you used.</p>
        <div className="mt-10">
          <TrackOrderForm />
        </div>
      </div>
    </main>
  );
}
