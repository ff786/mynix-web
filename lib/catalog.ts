import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { PRODUCTS as CONTENT } from "@/data/products";
import { CATEGORY_HIGHLIGHTS } from "@/data/ranges";
import { isPosConfigured, posRequest } from "@/lib/pos/client";
import type { Product, ProductCategory, ProductMedia } from "@/types/product";
import { withAutoVariants } from "@/utils/autoVariants";
import { groupListings, withSharedMedia } from "@/utils/listings";

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
  variantGroupId: number | null;
  variantGroupName: string | null;
  variantOptionName: string | null;
  variantLabel: string | null;
  categoryId: number;
  category: string;
  price: number;
  availableQuantity: number;
  imageUrl: string | null;
  media?: PosMedia[];
};

type PosMedia = {
  type: "IMAGE" | "VIDEO" | "YOUTUBE";
  url: string | null;
  youtubeId: string | null;
  altText: string | null;
  shared: boolean;
};

/** Server-side view of a product: what browsers see plus what ordering and photos need. */
export type CatalogEntry = {
  product: Product;
  barcode: string;
  /**
   * This product's photo links by version (the last part of their
   * /media/products/{id}/{version} address), fetched only by this server.
   */
  posImages: Record<string, string>;
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

/**
 * Only public https links are used. MEDIA_DEV_ORIGIN (local stack only, e.g.
 * http://localhost:9090) lets the local storage stand-in through as well.
 */
export const isAllowedMediaUrl = (url: URL) =>
  (url.protocol === "https:" && !url.username && !url.password) ||
  (!!process.env.MEDIA_DEV_ORIGIN && url.origin === process.env.MEDIA_DEV_ORIGIN);

const safeMediaUrl = (url: string | null) => {
  if (!url) return null;
  try {
    return isAllowedMediaUrl(new URL(url.trim())) ? url.trim() : null;
  } catch {
    return null;
  }
};

const version = (url: string) => createHash("sha256").update(url).digest("hex").slice(0, 10);

/** POS media -> gallery items; photos are addressed through this website. */
function galleryOf(id: string, row: PosProduct) {
  // An older POS only sends the single photo link.
  const items: PosMedia[] =
    row.media ?? (row.imageUrl ? [{ type: "IMAGE", url: row.imageUrl, youtubeId: null, altText: null, shared: false }] : []);
  const posImages: Record<string, string> = {};
  const media: ProductMedia[] = [];

  for (const item of items) {
    if (item.type === "YOUTUBE") {
      if (item.youtubeId && /^[A-Za-z0-9_-]{11}$/.test(item.youtubeId)) {
        media.push({ type: "youtube", id: item.youtubeId, shared: item.shared });
      }
      continue;
    }
    const url = safeMediaUrl(item.url);
    if (!url) continue;
    if (item.type === "VIDEO") {
      media.push({ type: "video", src: url, shared: item.shared });
    } else {
      const v = version(url);
      posImages[v] = url;
      media.push({
        type: "image",
        src: `/media/products/${id}/${v}`,
        alt: item.altText?.trim() || row.imageAlt?.trim() || undefined,
        shared: item.shared,
      });
    }
  }
  return { media, posImages };
}

async function loadCatalog(): Promise<CatalogEntry[]> {
  const rows = await posRequest<PosProduct[]>("/store/products");
  const usedIds = new Set<string>();

  const entries: CatalogEntry[] = rows.map((row) => {
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
    // Photo addresses change with the photo link, so browsers pick up new photos.
    const { media, posImages } = galleryOf(id, row);
    const mainImage = media.find((m) => m.type === "image");

    return {
      barcode: row.barcode,
      posImages,
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
        image: mainImage?.src ?? content?.image,
        imageAlt: mainImage?.alt ?? (row.imageAlt?.trim() || undefined),
        media,
        variant:
          row.variantGroupId && row.variantLabel
            ? {
                group: createHash("sha256").update(`variant-group:${row.variantGroupId}`).digest("hex").slice(0, 10),
                groupName: row.variantGroupName ?? row.name,
                optionName: row.variantOptionName ?? "Option",
                label: row.variantLabel,
              }
            : undefined,
        flagship: content?.flagship ?? false,
      },
    };
  });

  // Same category + same price = one listing with options (POS variant groups win),
  // then each option also shows its siblings' "All options" media.
  const products = withSharedMedia(withAutoVariants(entries.map((entry) => entry.product)));
  return entries.map((entry, i) => ({ ...entry, product: products[i] }));
}

const cachedCatalog = unstable_cache(loadCatalog, ["pos-catalog-v5"], {
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
    for (const listing of groupListings(products)) {
      const { category: id, categoryName: name } = listing.lead;
      const category = categories.get(id);
      if (category) category.count += 1;
      else categories.set(id, { id, name, count: 1, highlights: [] });
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
