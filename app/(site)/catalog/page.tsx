import type { Metadata } from "next";
import ProductGrid from "@/components/catalog/ProductGrid";
import Eyebrow from "@/components/ui/text/Eyebrow";
import Reveal from "@/components/ui/text/Reveal";
import RevealText from "@/components/ui/text/RevealText";
import type { CategoryFilterValue } from "@/components/catalog/CategoryFilter";
import { CATEGORIES } from "@/data/products";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Catalog",
  description:
    "Search the full MYNIX catalog of gem torches, optical instruments, loupes, scales, lapidary supplies and appraisal accessories.",
};

const isCategory = (value: unknown): value is CategoryFilterValue =>
  value === "all" || CATEGORIES.some((c) => c.id === value);

export default async function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  const { category } = await searchParams;
  const initialCategory = isCategory(category) ? category : "all";
  const products = await getProducts();

  return (
    <main data-theme="dark" data-section-bg="#050505" className="min-h-screen px-6 pb-24 pt-36 sm:px-10 sm:pt-44">
      <div className="mx-auto max-w-7xl">
        <Eyebrow className="mb-5">Full Catalog</Eyebrow>
        <RevealText
          as="h1"
          text={"The MYNIX\nCollection"}
          delay={0.1}
          className="text-5xl font-semibold uppercase leading-[0.9] tracking-tighter text-ink/90 sm:text-7xl lg:text-8xl"
        />
        <Reveal as="p" delay={0.4} className="mt-8 max-w-lg leading-relaxed text-ink/60">
          {products.length} professional instruments across {CATEGORIES.length} categories. Search by name,
          then inquire directly on WhatsApp for pricing and availability.
        </Reveal>

        <div className="mt-16">
          {/* Re-mount when the category query changes (e.g. footer links) to reset the filter. */}
          <ProductGrid key={initialCategory} products={products} initialCategory={initialCategory} />
        </div>
      </div>
    </main>
  );
}
