"use client";

import { useEffect, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { buttonClasses } from "@/components/ui/Button";
import type { Product } from "@/types/product";
import { cn } from "@/utils/cn";

type AddToCartButtonProps = {
  product: Product;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function AddToCartButton({ product, quantity = 1, size = "sm", className }: AddToCartButtonProps) {
  const { lines, add } = useCart();
  const [added, setAdded] = useState(false);
  const inCart = lines.find((l) => l.id === product.id)?.quantity ?? 0;
  const full = inCart >= product.maxQuantity;

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(timer);
  }, [added]);

  if (!product.inStock) {
    return (
      <button type="button" disabled className={buttonClasses({ variant: "secondary", size, className: cn("opacity-50", className) })}>
        Sold out
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={full}
      onClick={() => {
        add(product.id, quantity, product.maxQuantity);
        setAdded(true);
      }}
      aria-live="polite"
      className={buttonClasses({ size, className: cn("gap-2", full && "opacity-60", className) })}
    >
      {added ? <Check className="h-4 w-4 shrink-0" /> : <ShoppingBag className="h-4 w-4 shrink-0" />}
      <span className="whitespace-nowrap">{added ? "Added" : full ? "Max in cart" : "Add to cart"}</span>
    </button>
  );
}
