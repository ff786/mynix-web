import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { PRODUCTS as CONTENT } from "@/data/products";
import { CATEGORY_HIGHLIGHTS } from "@/data/ranges";
import { isPosConfigured, posRequest } from "@/lib/pos/client";
import type { Product, ProductCategory } from "@/types/product";

/**
 * The storefront catalogue: every active POS product (name, category, price,
 * availability), enriched with the website's own descriptions and photos.
 * Cached for a minute, so products added in the POS appear shortly after.
 */

type PosProduct = {
  id: number;
  barcode: string;
  /** Full name (the short POS name never leaves the POS). */
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  imageAlt: string | null;
  categoryId: number;
  category: string;
  price: number;
  availableQuantity: number;
  imageUrl: string | null;
};

/** Server-side view of a product: what browsers see plus what ordering and photos need. */
export type CatalogEntry = {
  product: Product;
  barcode: string;
  /** The POS photo URL, fetched only by the website's server (see /media/products). */
  posImageUrl: string | null;
  /** Per-product search settings from the POS; blank fields fall back to name/description. */
  seo: ProductSeo;
};

export type ProductSeo = {
  title: string | null;
  description: string | null;
  keywords: string[];
};

export const CATALOG_TAG = "catalog";
const MAX_PER_ORDER = 10;

const normalise = (text: string) =>
  text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const slugify = (text: string) => normalise(text).replace(/ /g, "-").slice(0, 80) || "item";

/** First paragraph as one line of plain text (bullets become sentences). */
function firstParagraph(description: string): string {
  const [first = ""] = description.split(/\n\s*\n/);
  return first
    .split("\n")
    .map((line) => line.replace(/^\s*[-•]\s+/, "").trim())
    .filter(Boolean)
    .join(" · ");
}

const contentByName = new Map(CONTENT.map((content) => [normalise(content.name), content]));

/** Only public https photo links are ever fetched. */
const safeImageUrl = (url: string | null) => {
  if (!url) return null;
  try {
    return new URL(url.trim()).protocol === "https:" ? url.trim() : null;
  } catch {
    return null;
  }
};

async function loadCatalog(): Promise<CatalogEntry[]> {
  const rows = await posRequest<PosProduct[]>("/store/products");
  const usedIds = new Set<string>();

  return rows.map((row) => {
    // The POS keeps page addresses unique; the fallback covers an older POS.
    const base = row.slug?.trim() || slugify(row.name);
    let id = base;
    for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
    usedIds.add(id);

    const content = contentByName.get(normalise(row.name));
    // Descriptions written in the POS replace the website's built-in copy.
    const posDescription = row.description?.trim() || null;
    const description = posDescription ?? content?.description ?? "";
    const available = Math.max(0, row.availableQuantity);
    const posImageUrl = safeImageUrl(row.imageUrl);
    // The version changes with the photo link, so browsers pick up a new photo.
    const photoVersion = posImageUrl && createHash("sha256").update(posImageUrl).digest("hex").slice(0, 10);

    return {
      barcode: row.barcode,
      posImageUrl,
      seo: {
        title: row.seoTitle?.trim() || null,
        description: row.seoDescription?.trim() || null,
        keywords: (row.seoKeywords ?? "")
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      },
      product: {
        id,
        name: row.name,
        category: slugify(row.category),
        categoryName: row.category,
        price: Number(row.price),
        inStock: available > 0,
        maxQuantity: Math.min(available, MAX_PER_ORDER),
        description,
        summary: firstParagraph(description),
        features: posDescription ? [] : (content?.features ?? []),
        image: posImageUrl ? `/media/products/${id}/${photoVersion}` : content?.image,
        imageAlt: row.imageAlt?.trim() || undefined,
        flagship: content?.flagship ?? false,
      },
    };
  });
}

const cachedCatalog = unstable_cache(loadCatalog, ["pos-catalog-v2"], {
  revalidate: 60,
  tags: [CATALOG_TAG],
});

/** Server-only: catalogue with POS details, for placing orders and serving photos. */
export async function getCatalogEntries(): Promise<CatalogEntry[]> {
  return cachedCatalog();
}

/** Server-only: one product with its SEO settings, or null if it isn't on the website. */
export async function getCatalogEntry(id: string): Promise<CatalogEntry | null> {
  if (!isPosConfigured) return null;
  return (await cachedCatalog()).find((entry) => entry.product.id === id) ?? null;
}

export type Storefront = {
  products: Product[];
  categories: ProductCategory[];
  /** False when the POS couldn't be reached; pages show a friendly notice. */
  available: boolean;
};

const highlightFor = (name: string) =>
  CATEGORY_HIGHLIGHTS.find((highlight) => normalise(highlight.name) === normalise(name));

/** Curated order from data/ranges.ts first, then A–Z. */
function byDisplayOrder(a: ProductCategory, b: ProductCategory): number {
  const rank = (c: ProductCategory) => {
    const i = CATEGORY_HIGHLIGHTS.findIndex((highlight) => normalise(highlight.name) === normalise(c.name));
    return i === -1 ? CATEGORY_HIGHLIGHTS.length : i;
  };
  return rank(a) - rank(b) || a.name.localeCompare(b.name);
}

/** Browser-safe catalogue for pages. */
export async function getStorefront(): Promise<Storefront> {
  if (!isPosConfigured) return { products: [], categories: [], available: false };

  try {
    const products = (await cachedCatalog()).map((entry) => entry.product);
    const categories = new Map<string, ProductCategory>();
    for (const p of products) {
      const category = categories.get(p.category);
      if (category) category.count += 1;
      else categories.set(p.category, { id: p.category, name: p.categoryName, count: 1, highlights: [] });
    }
    for (const category of categories.values()) {
      category.highlights = highlightFor(category.name)?.items ?? [];
    }

    return { products, categories: [...categories.values()].sort(byDisplayOrder), available: true };
  } catch (error) {
    console.error("[catalog] Could not load products from the POS:", error instanceof Error ? error.message : error);
    return { products: [], categories: [], available: false };
  }
}
