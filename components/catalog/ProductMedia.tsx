"use client";

import { useState } from "react";
import Image from "next/image";
import CategoryIcon from "@/components/catalog/CategoryIcon";
import type { Product } from "@/types/product";
import { cn } from "@/utils/cn";

type ProductMediaProps = {
  product: Product;
  sizes: string;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
};

/**
 * Product photo, or — when none is set or it can't be loaded — a category
 * illustration (never a broken image). Zooms on hover when inside a `group`.
 */
export default function ProductMedia({ product, sizes, className, priority, fit = "cover" }: ProductMediaProps) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(product.image) && !failed;

  return (
    <div className={cn("relative overflow-hidden", showPhoto ? "bg-white" : "bg-[#0b0b0c]", className)}>
      {showPhoto ? (
        <Image
          src={product.image!}
          alt={product.imageAlt ?? product.name}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className={cn(
            fit === "cover" ? "object-cover" : "object-contain",
            "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105",
          )}
        />
      ) : (
        <div
          role="img"
          aria-label={product.name}
          className="absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.05),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
          <CategoryIcon categoryName={product.categoryName} strokeWidth={1} className="relative h-1/3 w-1/3 text-white/25" />
        </div>
      )}
    </div>
  );
}
