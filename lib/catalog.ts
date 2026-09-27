import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { PRODUCTS as CONTENT } from "@/data/products";
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
  name: string;
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
    let id = slugify(row.name);
    for (let n = 2; usedIds.has(id); n++) id = `${slugify(row.name)}-${n}`;
    usedIds.add(id);

    const content = contentByName.get(normalise(row.name));
    const available = Math.max(0, row.availableQuantity);
    const posImageUrl = safeImageUrl(row.imageUrl);
    // The version changes with the photo link, so browsers pick up a new photo.
    const photoVersion = posImageUrl && createHash("sha256").update(posImageUrl).digest("hex").slice(0, 10);

    return {
      barcode: row.barcode,
      posImageUrl,
      product: {
        id,
        name: row.name,
        category: slugify(row.category),
        categoryName: row.category,
        price: Number(row.price),
        inStock: available > 0,
        maxQuantity: Math.min(available, MAX_PER_ORDER),
        description: content?.description ?? "",
        features: content?.features ?? [],
        image: posImageUrl ? `/media/products/${id}/${photoVersion}` : content?.image,
        flagship: content?.flagship ?? false,
      },
    };
  });
}

const cachedCatalog = unstable_cache(loadCatalog, ["pos-catalog-v1"], {
  revalidate: 60,
  tags: [CATALOG_TAG],
});

/** Server-only: catalogue with POS details, for placing orders and serving photos. */
export async function getCatalogEntries(): Promise<CatalogEntry[]> {
  return cachedCatalog();
}

export type Storefront = {
  products: Product[];
  categories: ProductCategory[];
  /** False when the POS couldn't be reached; pages show a friendly notice. */
  available: boolean;
};

/** Browser-safe catalogue for pages. */
export async function getStorefront(): Promise<Storefront> {
  if (!isPosConfigured) return { products: [], categories: [], available: false };

  try {
    const products = (await cachedCatalog()).map((entry) => entry.product);
    const categories = new Map<string, string>();
    for (const p of products) categories.set(p.category, p.categoryName);

    return {
      products,
      categories: [...categories].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
      available: true,
    };
  } catch (error) {
    console.error("[catalog] Could not load products from the POS:", error instanceof Error ? error.message : error);
    return { products: [], categories: [], available: false };
  }
}
