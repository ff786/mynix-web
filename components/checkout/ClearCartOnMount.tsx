"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";

/** Empties the cart once the order has been paid for and placed. */
export default function ClearCartOnMount() {
  const { ready, clear } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
