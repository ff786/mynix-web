"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { rememberedBuyNow } from "@/utils/buy-now";

/** Empties the cart once its order has been paid for and placed; a "Buy now" order never used the cart. */
export default function ClearCartOnMount() {
  const { ready, clear } = useCart();
  useEffect(() => {
    if (ready && !rememberedBuyNow()) clear();
  }, [ready, clear]);
  return null;
}
