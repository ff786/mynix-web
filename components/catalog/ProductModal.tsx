"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import ProductMedia from "@/components/catalog/ProductMedia";
import { buttonClasses } from "@/components/ui/Button";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { CATEGORY_BY_ID } from "@/data/products";
import type { Product } from "@/types/product";
import { cn } from "@/utils/cn";
import { useModalBehaviour } from "@/utils/useModalBehaviour";
import { getWhatsAppInquiryUrl } from "@/utils/whatsapp";

type ProductModalProps = {
  product: Product | null;
  onClose: () => void;
};

export default function ProductModal({ product, onClose }: ProductModalProps) {
  return (
    <AnimatePresence>
      {product && <ModalPanel key={product.sku} product={product} onClose={onClose} />}
    </AnimatePresence>
  );
}

function ModalPanel({ product, onClose }: { product: Product; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<string | null>(null);
  useModalBehaviour(true, onClose, panelRef);

  const category = CATEGORY_BY_ID[product.category];
  const titleId = `product-${product.sku}-title`;
  const inquiryName = variant ? `${product.name} — ${variant}` : product.name;

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
            {category.title}
          </span>

          <h2 id={titleId} className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-white/90 sm:text-3xl">
            {product.name}
          </h2>
          <p className="mt-3 leading-relaxed text-white/60">{product.description}</p>

          <h3 className="mt-8 text-xs font-medium uppercase tracking-[0.25em] text-white/40">Key features</h3>
          <ul className="mt-4 space-y-2.5">
            {product.features.map((feature) => (
              <li key={feature} className="flex gap-3 text-sm text-white/75">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {feature}
              </li>
            ))}
          </ul>

          {product.variants && (
            <fieldset className="mt-8">
              <legend className="text-xs font-medium uppercase tracking-[0.25em] text-white/40">
                Options <span className="normal-case tracking-normal text-white/30">(optional)</span>
              </legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {product.variants.map((option) => {
                  const selected = option === variant;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setVariant(selected ? null : option)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                        selected
                          ? "border-white bg-white text-[#1d1d1f]"
                          : "border-white/10 text-white/60 hover:border-white/30 hover:text-white",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:mt-auto sm:pt-10">
            <a
              href={getWhatsAppInquiryUrl(inquiryName, product.sku)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ size: "lg" })}
            >
              <WhatsAppIcon className="h-5 w-5" />
              Buy / Request Quote
            </a>
            <p className="text-center text-xs text-white/40">
              Opens WhatsApp with your inquiry pre-filled{variant ? ` (${variant})` : ""}.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
