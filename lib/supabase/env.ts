/**
 * Supabase connection settings. When these are missing (e.g. local work before
 * the project is set up) the site falls back to the bundled product list in
 * data/products.ts and the admin area explains what to configure.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Storage bucket for product photos (public read, admin write). */
export const PRODUCT_IMAGES_BUCKET = "product-images";

/** Cache tag on every public product read; admin saves expire it. */
export const PRODUCTS_TAG = "products";
