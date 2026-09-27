"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus, X } from "lucide-react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import ProductMedia from "@/components/catalog/ProductMedia";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import type { Product } from "@/types/product";
import { formatLkr } from "@/utils/money";
import { useModalBehaviour } from "@/utils/useModalBehaviour";
import { getWhatsAppInquiryUrl } from "@/utils/whatsapp";

type ProductModalProps = {
  product: Product | null;
  onClose: () => void;
};

export default function ProductModal({ product, onClose }: ProductModalProps) {
  return (
    <AnimatePresence>
      {product && <ModalPanel key={product.id} product={product} onClose={onClose} />}
    </AnimatePresence>
  );
}

function ModalPanel({ product, onClose }: { product: Product; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [quantity, setQuantity] = useState(1);
  useModalBehaviour(true, onClose, panelRef);

  const titleId = `product-${product.id}-title`;

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0a0a0b] text-white outline-none sm:rounded-3xl md:grid md:grid-cols-2"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white/80 backdrop-blur transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <ProductMedia
          product={product}
          sizes="(min-width: 768px) 448px, 100vw"
          fit="contain"
          className="aspect-[4/3] shrink-0 md:aspect-auto md:min-h-full"
        />

        <div className="flex flex-col p-6 sm:p-10">
          <span className="w-fit rounded-full border border-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">
            {product.categoryName}
          </span>

          <h2 id={titleId} className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-white/90 sm:text-3xl">
            {product.name}
          </h2>
          <p className="mt-4 text-2xl font-semibold tabular-nums text-white/90">{formatLkr(product.price)}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">
            {product.inStock ? "In stock" : "Sold out"}
          </p>
          {product.description && <p className="mt-5 leading-relaxed text-white/60">{product.description}</p>}

          {product.features.length > 0 && (
            <>
              <h3 className="mt-8 text-xs font-medium uppercase tracking-[0.25em] text-white/40">Key features</h3>
              <ul className="mt-4 space-y-2.5">
                {product.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-white/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:mt-auto sm:pt-10">
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
        </div>
      </motion.div>
    </motion.div>
  );
}
