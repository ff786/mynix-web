"use client";

import { motion } from "framer-motion";
import type { ProductCategory } from "@/types/product";
import { cn } from "@/utils/cn";

/** A category slug from the POS, or "all". */
export type CategoryFilterValue = string;

type CategoryFilterProps = {
  categories: ProductCategory[];
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
  counts: Record<CategoryFilterValue, number>;
  /** Unique per grid instance so the active pill animates independently. */
  layoutId: string;
};

export default function CategoryFilter({ categories, value, onChange, counts, layoutId }: CategoryFilterProps) {
  const options = [{ id: "all", label: "All Tools" }, ...categories.map(({ id, name }) => ({ id, label: name }))];

  return (
    <div
      role="group"
      aria-label="Filter by category"
      className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative shrink-0 rounded-full px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              active ? "text-[#1d1d1f]" : "text-white/60 hover:text-white",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-white"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            {!active && <span className="absolute inset-0 rounded-full border border-white/10" />}
            <span className="relative">
              {option.label}
              <span className={cn("ml-2 tabular-nums", active ? "text-black/60" : "text-white/55")}>
                {counts[option.id] ?? 0}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
