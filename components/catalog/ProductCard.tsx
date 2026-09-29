"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import ProductMedia from "@/components/catalog/ProductMedia";
import { buttonClasses } from "@/components/ui/Button";
import type { Product } from "@/types/product";
import { formatLkr } from "@/utils/money";

type ProductCardProps = {
  product: Product;
  /** Opens the quick view; without it the card links to the product page. */
  onQuickView?: (product: Product) => void;
  priority?: boolean;
  /** Heading level for the name (h3 when the card sits under a section heading). */
  headingAs?: "h2" | "h3";
};

export default function ProductCard({ product, onQuickView, priority, headingAs: Heading = "h2" }: ProductCardProps) {
  const href = `/products/${product.id}`;
  const soldOut = product.inStock ? "" : " — Sold out";
  const mediaClass =
    "relative block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";
  const detailsClass = buttonClasses({
    variant: "secondary",
    size: "sm",
    className: "min-h-12 gap-2 px-3",
  });
  const details = (
    <>
      <Info className="h-4 w-4 shrink-0" />
      <span className="whitespace-nowrap">Details</span>
    </>
  );

  const media = (
    <>
      <ProductMedia
        product={product}
        priority={priority}
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="aspect-[4/3]"
      />
      {!product.inStock && (
        <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur">
          Sold out
        </span>
      )}
    </>
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-colors duration-500 hover:border-white/25">
      {onQuickView ? (
        <button
          type="button"
          onClick={() => onQuickView(product)}
          aria-label={`Quick view: ${product.name}${soldOut}`}
          className={mediaClass}
        >
          {media}
        </button>
      ) : (
        <Link href={href} aria-label={`${product.name}${soldOut}`} className={mediaClass}>
          {media}
        </Link>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="mb-4 truncate text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
          {product.categoryName}
        </p>

        <Heading className="text-lg font-semibold leading-snug tracking-tight text-white/90">
          <Link href={href} className="transition-colors hover:text-white hover:underline hover:underline-offset-4">
            {product.name}
          </Link>
        </Heading>
        {product.summary && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/55">{product.summary}</p>
        )}
        <p className="mt-4 text-base font-semibold tabular-nums text-white/90">{formatLkr(product.price)}</p>

        <div className="mt-auto grid grid-cols-2 gap-2.5 pt-6">
          <AddToCartButton product={product} className="min-h-12 px-3" />
          {onQuickView ? (
            <button type="button" onClick={() => onQuickView(product)} className={detailsClass}>
              {details}
            </button>
          ) : (
            <Link href={href} className={detailsClass}>
              {details}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
