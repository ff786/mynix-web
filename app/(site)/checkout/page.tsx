import type { Metadata } from "next";
import StoreUnavailable from "@/components/catalog/StoreUnavailable";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { getStorefront } from "@/lib/catalog";
import { getCustomerSession } from "@/lib/customer/session";
import { bankTransferDetails, deliveryFee } from "@/lib/orders/config";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [{ products, available }, session] = await Promise.all([getStorefront(), getCustomerSession()]);

  return (
    <main data-theme="dark" data-section-bg="#050505" className="min-h-screen px-6 pb-24 pt-36 sm:px-10 sm:pt-44">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-12 text-4xl font-semibold uppercase tracking-tighter text-white/90 sm:text-6xl">Checkout</h1>
        {available ? <CheckoutForm
            products={products}
            deliveryFee={deliveryFee()}
            customer={session && { name: session.name, phone: session.phone }}
            bankDetails={bankTransferDetails()}
          /> : <StoreUnavailable />}
      </div>
    </main>
  );
}
