"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import ProductMedia from "@/components/catalog/ProductMedia";
import Button from "@/components/ui/Button";
import type { Product } from "@/types/product";
import { formatLkr } from "@/utils/money";

type CartViewProps = { products: Product[]; deliveryFee: number };

/** Cart lines joined with the live catalogue (prices and availability). */
export function useCartLines(products: Product[]) {
  const { lines } = useCart();
  const byId = new Map(products.map((p) => [p.id, p]));
  const joined = lines.map((line) => ({ line, product: byId.get(line.id) }));
  const valid = joined.filter(
    (j): j is { line: typeof j.line; product: Product } =>
      !!j.product && j.product.inStock && j.line.quantity <= j.product.maxQuantity,
  );
  const subtotal = valid.reduce((sum, j) => sum + j.product.price * j.line.quantity, 0);
  return { joined, valid, subtotal, hasProblems: valid.length !== joined.length };
}

export default function CartView({ products, deliveryFee }: CartViewProps) {
  const { ready, setQuantity, remove } = useCart();
  const { joined, valid, subtotal, hasProblems } = useCartLines(products);

  if (!ready) return <div className="h-40" aria-hidden />;

  if (joined.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center">
        <p className="text-lg font-semibold text-white/80">Your cart is empty.</p>
        <Button href="/catalog" size="md" className="mt-6">
          Browse the catalog
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y divide-white/10 border-y border-white/10">
        {joined.map(({ line, product }) => {
          const unavailable = !product || !product.inStock;
          const tooMany = !!product && line.quantity > product.maxQuantity;
          return (
            <li key={line.id} className="flex gap-4 py-5 sm:gap-6">
              {product ? (
                <ProductMedia product={product} sizes="96px" className="h-24 w-24 shrink-0 rounded-xl" fit="contain" />
              ) : (
                <div className="h-24 w-24 shrink-0 rounded-xl bg-white/[0.04]" />
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="font-medium text-white/90">{product?.name ?? "Item no longer available"}</p>
                {product && <p className="mt-1 text-sm tabular-nums text-white/55">{formatLkr(product.price)}</p>}
                {(unavailable || tooMany) && (
                  <p className="mt-1 text-sm text-amber-300/90">
                    {unavailable ? "Sold out — please remove it." : `Only ${product!.maxQuantity} available.`}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-3">
                  {product && !unavailable ? (
                    <div className="flex items-center gap-1 rounded-full border border-white/10">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.id, line.quantity - 1, product.maxQuantity)}
                        aria-label={`Decrease quantity of ${product.name}`}
                        className="rounded-full p-2 text-white/60 hover:text-white"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.id, line.quantity + 1, product.maxQuantity)}
                        disabled={line.quantity >= product.maxQuantity}
                        aria-label={`Increase quantity of ${product.name}`}
                        className="rounded-full p-2 text-white/60 hover:text-white disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => remove(line.id)}
                    className="flex items-center gap-1.5 text-sm text-white/45 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between text-white/60">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatLkr(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-white/60">
            <dt>Delivery</dt>
            <dd className="tabular-nums">{deliveryFee > 0 ? formatLkr(deliveryFee) : "Free"}</dd>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold text-white/90">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatLkr(subtotal + (valid.length ? deliveryFee : 0))}</dd>
          </div>
        </dl>
        {hasProblems && (
          <p className="mt-4 text-sm text-amber-300/90">Please fix the items marked above to continue.</p>
        )}
        {hasProblems || valid.length === 0 ? (
          <button type="button" disabled className="mt-6 w-full rounded-full bg-white/20 py-3.5 text-sm font-medium text-white/50">
            Checkout
          </button>
        ) : (
          <Link
            href="/checkout"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-medium text-[#1d1d1f] transition-opacity hover:opacity-90"
          >
            Checkout <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <p className="mt-4 text-center text-xs text-white/40">Cash on delivery anywhere in Sri Lanka.</p>
      </aside>
    </div>
  );
}
