import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import ProductCard from "@/components/catalog/ProductCard";
import ProductDescription from "@/components/catalog/ProductDescription";
import ProductMedia from "@/components/catalog/ProductMedia";
import PurchasePanel from "@/components/catalog/PurchasePanel";
import StoreUnavailable from "@/components/catalog/StoreUnavailable";
import { getCatalogEntry, getStorefront, type CatalogEntry } from "@/lib/catalog";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { formatLkr } from "@/utils/money";

const DESCRIPTION_LENGTH = 155;

/** Search description: the one set in the POS, else the start of the product description. */
function metaDescription({ product, seo }: CatalogEntry): string {
  if (seo.description) return seo.description;
  const text = product.description.replace(/^\s*[-•]\s+/gm, "").replace(/\s+/g, " ").trim();
  if (!text) return `${product.name} — ${product.categoryName} from MYNIX. Cash on delivery across Sri Lanka.`;
  return text.length > DESCRIPTION_LENGTH
    ? `${text.slice(0, DESCRIPTION_LENGTH - 1).replace(/\s+\S*$/, "")}…`
    : text;
}

const absolute = (path: string) => `${SITE_URL}${path}`;

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getCatalogEntry(slug).catch(() => null);
  if (!entry) return { title: "Product not found", robots: { index: false } };

  const { product, seo } = entry;
  const description = metaDescription(entry);
  const path = `/products/${product.id}`;
  const socialTitle = seo.title ?? `${product.name} · ${SITE_NAME}`;
  // Without a product photo, the site-wide preview image is used.
  const images = product.image ? [{ url: product.image, alt: product.imageAlt ?? product.name }] : undefined;

  return {
    // A POS SEO title is used exactly as written; otherwise "<name> · MYNIX Gemology".
    title: seo.title ? { absolute: seo.title } : product.name,
    description,
    keywords: seo.keywords.length ? seo.keywords : undefined,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title: socialTitle, description, images },
    twitter: { card: images ? "summary_large_image" : "summary", title: socialTitle, description, images },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const { products, available } = await getStorefront();

  if (!available) {
    return (
      <main data-theme="dark" data-section-bg="#050505" className="min-h-screen px-6 pb-24 pt-36 sm:px-10 sm:pt-44">
        <div className="mx-auto max-w-3xl">
          <StoreUnavailable />
        </div>
      </main>
    );
  }

  const entry = await getCatalogEntry(slug);
  if (!entry) notFound();
  const { product } = entry;
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);
  const url = absolute(`/products/${product.id}`);
  const categoryUrl = absolute(`/catalog?category=${product.category}`);

  // Google product result: name, photo, price in LKR and availability, plus breadcrumbs.
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: metaDescription(entry),
      image: product.image ? [absolute(product.image)] : undefined,
      category: product.categoryName,
      brand: { "@type": "Brand", name: SITE_NAME },
      url,
      offers: {
        "@type": "Offer",
        url,
        price: product.price.toFixed(2),
        priceCurrency: "LKR",
        availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: "MYNIX (PVT) LTD" },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absolute("/") },
        { "@type": "ListItem", position: 2, name: "Catalog", item: absolute("/catalog") },
        { "@type": "ListItem", position: 3, name: product.categoryName, item: categoryUrl },
        { "@type": "ListItem", position: 4, name: product.name, item: url },
      ],
    },
  ];

  return (
    <main data-theme="dark" data-section-bg="#050505" className="min-h-screen px-6 pb-24 pt-32 sm:px-10 sm:pt-40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-white/45">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/catalog" className="hover:text-white">
                Catalog
              </Link>
            </li>
            <ChevronRight aria-hidden className="h-3.5 w-3.5" />
            <li>
              <Link href={`/catalog?category=${product.category}#shop`} className="hover:text-white">
                {product.categoryName}
              </Link>
            </li>
            <ChevronRight aria-hidden className="h-3.5 w-3.5" />
            <li aria-current="page" className="max-w-[16rem] truncate text-white/70">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          <ProductMedia
            product={product}
            priority
            sizes="(min-width: 1152px) 548px, (min-width: 768px) 50vw, 100vw"
            fit="contain"
            className="aspect-square overflow-hidden rounded-3xl border border-white/10"
          />

          <div className="flex flex-col">
            <span className="w-fit rounded-full border border-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">
              {product.categoryName}
            </span>
            <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-white/90 sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-5 text-3xl font-semibold tabular-nums text-white/90">{formatLkr(product.price)}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
              {product.inStock ? "In stock · Cash on delivery island-wide" : "Sold out"}
            </p>

            <div className="mt-8">
              <PurchasePanel product={product} />
            </div>
          </div>
        </div>

        {(product.description || product.features.length > 0) && (
          <section aria-labelledby="details-title" className="mt-20 max-w-3xl border-t border-white/10 pt-12">
            <h2 id="details-title" className="text-xs font-medium uppercase tracking-[0.25em] text-white/45">
              Product details
            </h2>
            {product.description && <ProductDescription description={product.description} className="mt-6" />}
            {product.features.length > 0 && (
              <ProductDescription
                description={product.features.map((feature) => `- ${feature}`).join("\n")}
                className="mt-6"
              />
            )}
          </section>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mt-20 border-t border-white/10 pt-12">
            <h2 id="related-title" className="text-xs font-medium uppercase tracking-[0.25em] text-white/45">
              More in {product.categoryName}
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} headingAs="h3" />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

