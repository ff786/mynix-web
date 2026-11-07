"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { rememberedBuyNow } from "@/utils/buy-now";

const noopSubscribe = () => () => {};

/** Back to the checkout this tab was paying for: a "Buy now" item, or else the cart. */
export default function BackToCheckoutLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const href = useSyncExternalStore(noopSubscribe, () => rememberedBuyNow() ?? "/checkout", () => "/checkout");
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
