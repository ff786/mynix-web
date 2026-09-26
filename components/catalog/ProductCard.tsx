"use client";

import { Info } from "lucide-react";
import ProductMedia from "@/components/catalog/ProductMedia";
import { buttonClasses } from "@/components/ui/Button";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { CATEGORY_BY_ID } from "@/data/products";
import type { Product } from "@/types/product";
import { getWhatsAppInquiryUrl } from "@/utils/whatsapp";

type ProductCardProps = {
  product: Product;
  onQuickView: (product: Product) => void;
  priority?: boolean;
};

export default function ProductCard({ product, onQuickView, priority }: ProductCardProps) {
  const category = CATEGORY_BY_ID[product.category];

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-colors duration-500 hover:border-white/25"
    >
      <button
        type="button"
        onClick={() => onQuickView(product)}
        aria-label={`Quick view: ${product.name}`}
        className="relative block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <ProductMedia
          product={product}
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="aspect-[4/3]"
        />
      </button>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="mb-4 truncate text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
          {category.label}
        </p>

        <h3 className="text-lg font-semibold leading-snug tracking-tight text-white/90">{product.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/55">{product.description}</p>
        {product.variants && (
          <p className="mt-3 text-xs text-white/40">{product.variants.length} options available</p>
        )}

        {/* Two equal columns; the WhatsApp label is set on two lines by design. */}
        <div className="mt-auto grid grid-cols-2 gap-2.5 pt-6">
          <a
            href={getWhatsAppInquiryUrl(product.name, product.sku)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Inquire about ${product.name} via WhatsApp`}
            className={buttonClasses({ size: "sm", className: "min-h-14 gap-2.5 px-3" })}
          >
            <WhatsAppIcon className="h-5 w-5 shrink-0" />
            <span className="text-left leading-tight">
              Inquire via
              <br />
              WhatsApp
            </span>
          </a>
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className={buttonClasses({ variant: "secondary", size: "sm", className: "min-h-14 gap-2 px-3" })}
          >
            <Info className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">Quick Specs</span>
          </button>
        </div>
      </div>
    </article>
  );
}
