"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import type { Product } from "@/types/product";
import { getWhatsAppInquiryUrl } from "@/utils/whatsapp";

/** Quantity picker, add to cart and a WhatsApp question link (quick view and product page). */
export default function PurchasePanel({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-col gap-3">
      {product.inStock && (
        <div className="flex items-center justify-between rounded-full border border-white/10 px-2 py-1.5">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="rounded-full p-2 text-white/70 hover:text-white disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span aria-live="polite" className="text-sm tabular-nums text-white/80">
            Quantity {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(product.maxQuantity, q + 1))}
            disabled={quantity >= product.maxQuantity}
            aria-label="Increase quantity"
            className="rounded-full p-2 text-white/70 hover:text-white disabled:opacity-30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
      <AddToCartButton product={product} quantity={quantity} size="lg" />
      <a
        href={getWhatsAppInquiryUrl(product.name)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 py-2 text-sm text-white/55 transition-colors hover:text-white"
      >
        <WhatsAppIcon className="h-4 w-4" />
        Questions? Ask us on WhatsApp
      </a>
    </div>
  );
}
