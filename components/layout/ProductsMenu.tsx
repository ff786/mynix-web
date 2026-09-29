"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import CategoryIcon from "@/components/catalog/CategoryIcon";
import type { ProductCategory } from "@/types/product";

type ProductsMenuProps = {
  id: string;
  categories: ProductCategory[];
  productCount: number;
  /** The Products section on the home page (all category tiles). */
  allCategoriesHref: string;
  /** Lets the landing page scroll to its Products section itself. */
  onAllCategories: (event: React.MouseEvent) => void;
  onNavigate: () => void;
};

/**
 * Desktop "Products" menu: a full-width panel under the navbar listing the POS
 * categories. Each opens the catalog filtered to that category.
 */
export default function ProductsMenu({
  id,
  categories,
  productCount,
  allCategoriesHref,
  onAllCategories,
  onNavigate,
}: ProductsMenuProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-x-0 top-full hidden border-b border-ink/10 bg-canvas text-ink shadow-[0_24px_48px_-24px_rgba(0,0,0,0.25)] lg:block"
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-10 px-10 pb-12 pt-10">
        <div className="col-span-3 flex flex-col">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-ink/45">Shop by category</p>
          <p className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-ink/90">Tools of the trade.</p>
          <p className="mt-3 text-sm leading-relaxed text-ink/55">
            {productCount} professional instruments across {categories.length} categories, with cash on delivery
            island-wide.
          </p>
          <Link
            href={allCategoriesHref}
            onClick={(e) => {
              onNavigate();
              onAllCategories(e);
            }}
            className="group mt-auto inline-flex w-fit items-center gap-2 pt-8 text-sm font-medium text-ink/80 transition-colors hover:text-accent"
          >
            Browse all categories
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <ul className="col-span-9 grid grid-cols-3 gap-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/catalog?category=${category.id}#shop`}
                onClick={onNavigate}
                className="group flex items-start gap-4 rounded-2xl p-4 transition-colors hover:bg-ink/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink/10 transition-colors group-hover:border-accent/40">
                  <CategoryIcon
                    categoryName={category.name}
                    className="h-5 w-5 text-ink/55 transition-colors group-hover:text-accent"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink/90">{category.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-ink/45">
                    {category.count} {category.count === 1 ? "product" : "products"}
                    {category.highlights[0] && ` · ${category.highlights[0]}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
