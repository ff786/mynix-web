"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import type { Product } from "@/types/product";
import { buyNowHref } from "@/utils/buy-now";
import { cn } from "@/utils/cn";
import { meetsMinimumOrder } from "@/utils/money";

type BuyNowButtonProps = {
  product: Product;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/** Below the minimum order an item can only be combined with others in the cart. */
export const canBuyNow = (product: Product, quantity = 1) =>
  product.inStock && meetsMinimumOrder(product.price * quantity);

export default function BuyNowButton({ product, quantity = 1, size = "sm", className }: BuyNowButtonProps) {
  if (!canBuyNow(product, quantity)) return null;

  return (
    <Link
      href={buyNowHref({ id: product.id, quantity })}
      prefetch={false}
      className={buttonClasses({ size, className: cn("gap-2", className) })}
    >
      <Zap className="h-4 w-4 shrink-0" />
      <span className="whitespace-nowrap">Buy now</span>
    </Link>
  );
}
