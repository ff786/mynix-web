"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Search, Star, Trash2 } from "lucide-react";
import { deleteProduct, setPublished } from "@/app/admin/actions";
import { inputClasses } from "@/components/admin/fields";
import { CATEGORIES, CATEGORY_BY_ID } from "@/data/products";
import { resolveImageUrl } from "@/lib/images";
import type { CategoryId, ProductRow } from "@/types/product";
import { cn } from "@/utils/cn";

export default function ProductTable({ products }: { products: ProductRow[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const deferredQuery = useDeferredValue(query);

  const visible = useMemo(() => {
    const terms = deferredQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      const haystack = `${p.name} ${p.sku}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [products, deferredQuery, category]);

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search products</span>
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or code…"
            className={cn(inputClasses, "pl-11")}
          />
        </label>
        <label className="sm:w-60">
          <span className="sr-only">Filter by category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId | "all")}
            className={inputClasses}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-ink/10 bg-white">
        {visible.length === 0 ? (
          <p className="px-6 py-16 text-center text-ink/50">
            {products.length === 0 ? "No products yet — add your first one." : "No products match."}
          </p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {visible.map((product) => (
              <ProductRowItem key={product.id} product={product} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ProductRowItem({ product }: { product: ProductRow }) {
  const [pending, startTransition] = useTransition();
  const image = resolveImageUrl(product.image);

  return (
    <li className={cn("flex items-center gap-4 px-4 py-3.5 sm:gap-5 sm:px-6", pending && "opacity-60")}>
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f5f5f7]">
        {image && <Image src={image} alt="" fill sizes="56px" className="object-cover" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate font-medium">
          {product.flagship && <Star aria-label="Flagship" className="h-3.5 w-3.5 shrink-0 fill-accent text-accent" />}
          <span className="truncate">{product.name}</span>
        </p>
        <p className="mt-0.5 truncate text-[13px] text-ink/50">
          {CATEGORY_BY_ID[product.category]?.label ?? product.category} · {product.sku}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={product.published}
        aria-label={`${product.published ? "Hide" : "Show"} ${product.name} on the website`}
        onClick={() => startTransition(() => setPublished(product.id, !product.published))}
        disabled={pending}
        className="inline-flex shrink-0 items-center gap-2 text-[13px] text-ink/60"
      >
        <span
          className={cn(
            "relative h-6 w-10 rounded-full transition-colors",
            product.published ? "bg-accent" : "bg-ink/15",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left]",
              product.published ? "left-[18px]" : "left-0.5",
            )}
          />
        </span>
        <span className="hidden sm:inline">{product.published ? "Live" : "Hidden"}</span>
      </button>

      <Link
        href={`/admin/products/${product.id}`}
        aria-label={`Edit ${product.name}`}
        className="rounded-full p-2.5 text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        type="button"
        aria-label={`Delete ${product.name}`}
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Delete “${product.name}”? This can't be undone.`)) return;
          startTransition(() => deleteProduct(product.id));
        }}
        className="rounded-full p-2.5 text-ink/60 transition-colors hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
