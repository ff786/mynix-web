"use client";

import { useCallback, useDeferredValue, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import CategoryFilter, { type CategoryFilterValue } from "@/components/catalog/CategoryFilter";
import ProductCard from "@/components/catalog/ProductCard";
import ProductModal from "@/components/catalog/ProductModal";
import Button from "@/components/ui/Button";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import type { Product, ProductCategory } from "@/types/product";
import { getWhatsAppGeneralUrl } from "@/utils/whatsapp";

type ProductGridProps = {
  products: Product[];
  categories: ProductCategory[];
  initialCategory?: CategoryFilterValue;
  /** Open this product's details on arrival (e.g. from "Order the kit"). */
  initialProductId?: string;
  /** Show at most this many results, with a link through to the full catalog. */
  limit?: number;
};

const normalise = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const searchText = (p: Product) =>
  normalise(
    [p.name, p.categoryName, p.description, ...p.features].join(" "),
  );

export default function ProductGrid({ products, categories, initialCategory = "all", initialProductId, limit }: ProductGridProps) {
  const [category, setCategory] = useState<CategoryFilterValue>(initialCategory);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(
    () => products.find((p) => p.id === initialProductId) ?? null,
  );
  const deferredQuery = useDeferredValue(query);
  const closeModal = useCallback(() => setSelected(null), []);
  const uid = useId();

  // Pre-computed search haystack per product.
  const index = useMemo(() => new Map(products.map((p) => [p.id, searchText(p)])), [products]);
  const terms = useMemo(() => normalise(deferredQuery).split(" ").filter(Boolean), [deferredQuery]);

  // Counts reflect the current search so tabs never promise empty results.
  const searched = useMemo(
    () => products.filter((p) => terms.every((term) => (index.get(p.id) ?? "").includes(term))),
    [products, index, terms],
  );
  const counts = useMemo(() => {
    const result: Record<CategoryFilterValue, number> = { all: searched.length };
    for (const p of searched) result[p.category] = (result[p.category] ?? 0) + 1;
    return result;
  }, [searched]);

  const filtered = category === "all" ? searched : searched.filter((p) => p.category === category);
  const visible = limit ? filtered.slice(0, limit) : filtered;
  const hiddenCount = filtered.length - visible.length;

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <CategoryFilter categories={categories} value={category} onChange={setCategory} counts={counts} layoutId={`${uid}-pill`} />

        <label className="relative block w-full lg:max-w-xs">
          <span className="sr-only">Search products</span>
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools…"
            className="w-full rounded-full border border-white/10 bg-white/[0.03] py-3 pl-11 pr-11 text-sm text-white placeholder:text-white/35 transition-colors focus:border-white/30 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
      </div>

      <p aria-live="polite" className="mt-8 text-xs uppercase tracking-[0.2em] text-white/40">
        {filtered.length === 0
          ? "No matching products"
          : `Showing ${visible.length} of ${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
      </p>

      {filtered.length > 0 ? (
        <motion.ul layout className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((product, i) => (
              <motion.li
                key={product.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProductCard product={product} onQuickView={setSelected} priority={i < 2 && !!product.image} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white/80">Can&apos;t find what you&apos;re looking for?</p>
          <p className="mt-2 max-w-sm text-sm text-white/50">
            Our range changes often — ask the MYNIX team and we&apos;ll source it for you.
          </p>
          <Button href={getWhatsAppGeneralUrl()} external size="sm" className="mt-6">
            <WhatsAppIcon className="h-4 w-4" />
            Ask on WhatsApp
          </Button>
        </div>
      )}

      {hiddenCount > 0 && (
        <div className="mt-12 flex justify-center">
          <Button
            href={category === "all" ? "/catalog" : `/catalog?category=${category}`}
            variant="secondary"
            size="md"
          >
            View all {filtered.length} in catalog
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      )}

      <ProductModal product={selected} onClose={closeModal} />
    </div>
  );
}
