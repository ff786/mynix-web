"use client";

import { useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import ProductDescription from "@/components/catalog/ProductDescription";
import ProductGallery from "@/components/catalog/ProductGallery";
import PurchasePanel from "@/components/catalog/PurchasePanel";
import VariantPicker from "@/components/catalog/VariantPicker";
import type { Product } from "@/types/product";
import { formatLkr } from "@/utils/money";
import { useModalBehaviour } from "@/utils/useModalBehaviour";

type ProductModalProps = {
  product: Product | null;
  /** All options when the product is part of a variable product (else just the product). */
  options: Product[];
  /** Switch to another option in place. */
  onSelect: (product: Product) => void;
  onClose: () => void;
};

export default function ProductModal({ product, options, onSelect, onClose }: ProductModalProps) {
  return (
    <AnimatePresence>
      {product && (
        // Keyed by listing, so choosing another option updates the open dialog instead of re-opening it.
        <ModalPanel
          key={product.variant?.group ?? product.id}
          product={product}
          options={options}
          onSelect={onSelect}
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  );
}

type ModalPanelProps = {
  product: Product;
  options: Product[];
  onSelect: (product: Product) => void;
  onClose: () => void;
};

function ModalPanel({ product, options, onSelect, onClose }: ModalPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
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

        <div className="shrink-0 md:p-6 md:pr-0">
          <ProductGallery
            key={product.id}
            product={product}
            sizes="(min-width: 768px) 424px, 100vw"
            className="aspect-[4/3] md:aspect-square md:rounded-2xl"
          />
        </div>

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
          <VariantPicker current={product} options={options} onSelect={onSelect} className="mt-6" />

          {product.description && <ProductDescription description={product.description} className="mt-5" />}

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

          <div className="mt-10 sm:mt-auto sm:pt-10">
            <PurchasePanel key={product.id} product={product} />
            <Link
              href={`/products/${product.id}`}
              className="mt-1 inline-flex w-full items-center justify-center gap-1.5 py-2 text-sm text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              View full product details
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
