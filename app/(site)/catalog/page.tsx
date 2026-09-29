import type { Metadata } from "next";
import ProductGrid from "@/components/catalog/ProductGrid";
import StoreUnavailable from "@/components/catalog/StoreUnavailable";
import Eyebrow from "@/components/ui/text/Eyebrow";
import Reveal from "@/components/ui/text/Reveal";
import RevealText from "@/components/ui/text/RevealText";
import { getStorefront } from "@/lib/catalog";

const CATALOG_DESCRIPTION =
  "Shop MYNIX gem torches, loupes, polariscopes, refractometers, precision scales, lapidary supplies and appraisal accessories. Cash on delivery across Sri Lanka.";

/** Each category view (/catalog?category=scales) is its own page for search engines. */
export async function generateMetadata({ searchParams }: PageProps<"/catalog">): Promise<Metadata> {
  const { category } = await searchParams;
  const { categories } = await getStorefront();
  const selected = typeof category === "string" ? categories.find((c) => c.id === category) : undefined;

  if (!selected) {
    return { title: "Shop the Catalog", description: CATALOG_DESCRIPTION, alternates: { canonical: "/catalog" } };
  }

  const highlights = selected.highlights.length ? ` ${selected.highlights.join(", ")}.` : "";
  return {
    title: `${selected.name} — Shop by Category`,
    description: `Shop ${selected.count} MYNIX ${selected.name.toLowerCase()} products online.${highlights} Cash on delivery across Sri Lanka.`,
    alternates: { canonical: `/catalog?category=${selected.id}` },
  };
}

export default async function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  const { category, product } = await searchParams;
  const { products, categories, available } = await getStorefront();
  const initialCategory =
    typeof category === "string" && categories.some((c) => c.id === category) ? category : "all";
  const initialProductId = typeof product === "string" ? product : undefined;

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
          {available
            ? `${products.length} professional instruments across ${categories.length} categories. Order online with cash on delivery anywhere in Sri Lanka.`
            : "Professional gemology tools and equipment."}
        </Reveal>

        {/* Category links land here (#shop), straight on the filtered results. */}
        <div id="shop" className="mt-16 scroll-mt-28">
          {available ? (
            // Re-mount when the query changes (e.g. footer links) to reset the filter.
            <ProductGrid
              key={`${initialCategory}:${initialProductId ?? ""}`}
              products={products}
              categories={categories}
              initialCategory={initialCategory}
              initialProductId={initialProductId}
              syncUrl
            />
          ) : (
            <StoreUnavailable />
          )}
        </div>
      </div>
    </main>
  );
}
