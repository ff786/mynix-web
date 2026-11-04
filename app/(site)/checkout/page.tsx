import type { Metadata } from "next";
import StoreUnavailable from "@/components/catalog/StoreUnavailable";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { getStorefront } from "@/lib/catalog";
import { getCustomerProfile, getSavedAddresses } from "@/lib/customer/profile";
import { deliveryFee } from "@/lib/orders/config";
import { canStartOnePayPayments } from "@/lib/payments/onepay";
import { vaultEnabled } from "@/lib/payments/vault";
import { SITE_URL_IS_SECURE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Enter your delivery details and place your MYNIX order — pay by card or cash on delivery anywhere in Sri Lanka.",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const [{ products, available }, customer, addresses] = await Promise.all([
    getStorefront(),
    getCustomerProfile(),
    getSavedAddresses(),
  ]);

  return (
    <main data-theme="dark" data-section-bg="#050505" className="min-h-dvh px-6 pb-24 pt-36 sm:px-10 sm:pt-44">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-12 text-4xl font-semibold uppercase tracking-tighter text-white/90 sm:text-6xl">Checkout</h1>
        {available ? <CheckoutForm
            products={products}
            deliveryFee={deliveryFee()}
            customer={customer}
            addresses={customer ? addresses : []}
            cardEnabled={canStartOnePayPayments && vaultEnabled && SITE_URL_IS_SECURE}
          /> : <StoreUnavailable />}
      </div>
    </main>
  );
}
