"use client";

import Link from "next/link";
import { Info, SlidersHorizontal } from "lucide-react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import ProductMedia from "@/components/catalog/ProductMedia";
import { buttonClasses } from "@/components/ui/Button";
import type { Product } from "@/types/product";
import type { Listing } from "@/utils/listings";
import { formatLkr } from "@/utils/money";

type ProductCardProps = {
  /** A standalone product, or every option of a variable product. */
  listing: Listing;
  /** Opens the quick view; without it the card links to the product page. */
  onQuickView?: (product: Product) => void;
  priority?: boolean;
  /** Heading level for the name (h3 when the card sits under a section heading). */
  headingAs?: "h2" | "h3";
};

const MAX_OPTION_CHIPS = 4;

export default function ProductCard({ listing, onQuickView, priority, headingAs: Heading = "h2" }: ProductCardProps) {
  const { lead, products: options, name } = listing;
  const variable = options.length > 1;
  const href = `/products/${lead.id}`;
  const soldOut = options.every((p) => !p.inStock);
  const soldOutLabel = soldOut ? " — Sold out" : "";
  const mediaClass =
    "relative block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";
  const secondaryClass = buttonClasses({ variant: "secondary", size: "sm", className: "min-h-12 gap-2 px-3" });
  const primaryClass = buttonClasses({ size: "sm", className: "min-h-12 gap-2 px-3" });
  const details = (
    <>
      <Info className="h-4 w-4 shrink-0" />
      <span className="whitespace-nowrap">Details</span>
    </>
  );
  const choose = (
    <>
      <SlidersHorizontal className="h-4 w-4 shrink-0" />
      <span className="whitespace-nowrap">Choose option</span>
    </>
  );

  const media = (
    <>
      <ProductMedia
        product={lead}
        priority={priority}
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="aspect-[4/3]"
      />
      {soldOut && (
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
          onClick={() => onQuickView(lead)}
          aria-label={`Quick view: ${name}${soldOutLabel}`}
          className={mediaClass}
        >
          {media}
        </button>
      ) : (
        <Link href={href} aria-label={`${name}${soldOutLabel}`} className={mediaClass}>
          {media}
        </Link>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="mb-4 truncate text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
          {lead.categoryName}
        </p>

        <Heading className="text-lg font-semibold leading-snug tracking-tight text-white/90">
          <Link href={href} className="transition-colors hover:text-white hover:underline hover:underline-offset-4">
            {name}
          </Link>
        </Heading>
        {lead.summary && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/55">{lead.summary}</p>}

        {variable && (
          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
              {options.length} {lead.variant!.optionName === "Option" ? "" : `${lead.variant!.optionName} `}options
            </p>
            <ul role="list" className="mt-2 flex flex-wrap gap-1.5">
              {options.slice(0, MAX_OPTION_CHIPS).map((option) => (
                <li
                  key={option.id}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/65"
                >
                  {option.variant!.label}
                </li>
              ))}
              {options.length > MAX_OPTION_CHIPS && (
                <li className="px-1 py-1 text-xs text-white/45">+{options.length - MAX_OPTION_CHIPS} more</li>
              )}
            </ul>
          </div>
        )}

        <p className="mt-4 text-base font-semibold tabular-nums text-white/90">
          {listing.minPrice === listing.maxPrice ? (
            formatLkr(listing.minPrice)
          ) : (
            <>
              <span className="text-sm font-normal text-white/50">From </span>
              {formatLkr(listing.minPrice)}
            </>
          )}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-2.5 pt-6">
          {!variable ? (
            <AddToCartButton product={lead} className="min-h-12 px-3" />
          ) : onQuickView ? (
            <button type="button" onClick={() => onQuickView(lead)} className={primaryClass}>
              {choose}
            </button>
          ) : (
            <Link href={href} className={primaryClass}>
              {choose}
            </Link>
          )}
          {onQuickView ? (
            <button type="button" onClick={() => onQuickView(lead)} className={secondaryClass}>
              {details}
            </button>
          ) : (
            <Link href={href} className={secondaryClass}>
              {details}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
