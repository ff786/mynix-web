"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

export default function CartButton() {
  const { count, ready } = useCart();
  const label = ready && count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart";

  return (
    <Link href="/cart" aria-label={label} className="relative rounded-full p-2 transition-opacity hover:opacity-70">
      <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
      {ready && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold tabular-nums text-canvas">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
