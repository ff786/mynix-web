import Image from "next/image";
import { Diamond, Flashlight, Microscope, Package, Scale, type LucideIcon } from "lucide-react";
import type { CategoryId, Product } from "@/types/product";
import { cn } from "@/utils/cn";

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  torches: Flashlight,
  optical: Microscope,
  scales: Scale,
  lapidary: Diamond,
  accessories: Package,
};

type ProductMediaProps = {
  product: Product;
  sizes: string;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
};

/**
 * Product photo, or — until photography is supplied via `product.image` — a
 * category illustration. Zooms on hover when inside a `group`.
 */
export default function ProductMedia({ product, sizes, className, priority, fit = "cover" }: ProductMediaProps) {
  const Icon = CATEGORY_ICONS[product.category];

  return (
    <div className={cn("relative overflow-hidden", product.image ? "bg-white" : "bg-[#0b0b0c]", className)}>
      {product.image ? (
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            fit === "cover" ? "object-cover" : "object-contain",
            "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105",
          )}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.05),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
          <Icon strokeWidth={1} className="relative h-1/3 w-1/3 text-white/25" />
        </div>
      )}
    </div>
  );
}
