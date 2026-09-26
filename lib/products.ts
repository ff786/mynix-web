import "server-only";
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS as BUNDLED_PRODUCTS } from "@/data/products";
import { resolveImageUrl } from "@/lib/images";
import {
  PRODUCTS_TAG,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import type { Product, ProductRow } from "@/types/product";

/**
 * Public product reads. Queries go through Next's fetch cache under the
 * `products` tag, so pages stay static and fast; the admin expires the tag on
 * every save, so edits appear on the next visit.
 */
const publicClient = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "force-cache", next: { tags: [PRODUCTS_TAG] } }),
      },
    })
  : null;

export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    description: row.description,
    features: row.features ?? [],
    variants: row.variants?.length ? row.variants : undefined,
    image: resolveImageUrl(row.image),
    flagship: row.flagship,
  };
}

/** Published products in display order. */
export async function getProducts(): Promise<Product[]> {
  if (!publicClient) return BUNDLED_PRODUCTS;

  const { data, error } = await publicClient
    .from("products")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    // Keep the storefront up if the database is unreachable.
    console.error("[products] Supabase query failed, serving bundled list:", error.message);
    return BUNDLED_PRODUCTS;
  }
  return (data as ProductRow[]).map(rowToProduct);
}
