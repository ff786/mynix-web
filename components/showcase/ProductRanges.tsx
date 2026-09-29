"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import CategoryIcon from "@/components/catalog/CategoryIcon";
import type { ProductCategory } from "@/types/product";

/** POS categories as a bordered tile grid; each tile opens the catalog filtered to that category. */
export default function ProductRanges({ categories }: { categories: ProductCategory[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {categories.map((category, i) => (
        <motion.li
          key={category.id}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: (i % 5) * 0.05 }}
        >
          <Link
            href={`/catalog?category=${category.id}#shop`}
            aria-label={`Shop ${category.name} (${category.count} ${category.count === 1 ? "product" : "products"})`}
            className="group flex h-full min-h-64 flex-col rounded-2xl border border-ink/10 bg-ink/[0.02] p-7 transition-[background-color,border-color,transform] duration-500 hover:-translate-y-0.5 hover:border-ink/20 hover:bg-ink/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent sm:p-8"
          >
            <div className="flex items-start justify-between">
              <CategoryIcon
                categoryName={category.name}
                className="h-7 w-7 text-ink/50 transition-colors duration-500 group-hover:text-ink"
              />
              <span className="font-mono text-[11px] tabular-nums text-ink/30">{String(i + 1).padStart(2, "0")}</span>
            </div>

            <h3 className="pt-12 text-xl font-semibold leading-tight tracking-tight text-ink/90">{category.name}</h3>
            <ul className="mt-3 space-y-1">
              {category.highlights.map((item) => (
                <li key={item} className="text-sm leading-relaxed text-ink/50">
                  {item}
                </li>
              ))}
              <li className="text-sm leading-relaxed text-ink/40">
                {category.count} {category.count === 1 ? "product" : "products"}
              </li>
            </ul>

            <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[13px] font-medium text-ink/50 transition-colors duration-300 group-hover:text-accent">
              Shop the category
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}
