import type { Metadata } from "next";
import CartView from "@/components/cart/CartView";
import StoreUnavailable from "@/components/catalog/StoreUnavailable";
import { getStorefront } from "@/lib/catalog";
import { deliveryFee } from "@/lib/orders/config";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the gemology tools in your MYNIX cart before checkout.",
  robots: { index: false },
};

export default async function CartPage() {
  const { products, available } = await getStorefront();

  return (
    <main data-theme="dark" data-section-bg="#050505" className="min-h-screen px-6 pb-24 pt-36 sm:px-10 sm:pt-44">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-12 text-4xl font-semibold uppercase tracking-tighter text-white/90 sm:text-6xl">Your cart</h1>
        {available ? <CartView products={products} deliveryFee={deliveryFee()} /> : <StoreUnavailable />}
      </div>
    </main>
  );
}
