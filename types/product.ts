export type CategoryId = "torches" | "optical" | "scales" | "lapidary" | "accessories";

export interface Category {
  id: CategoryId;
  /** Short label used on filter tabs. */
  label: string;
  /** Full name used in headings and badges. */
  title: string;
  description: string;
}

export interface Product {
  /** Database id (absent for the bundled fallback list). */
  id?: string;
  /** Product code — used as the ID in WhatsApp inquiries and search; not displayed. */
  sku: string;
  name: string;
  category: CategoryId;
  /** One-line summary shown on the card. */
  description: string;
  /** Bullet points shown in the quick-view modal. */
  features: string[];
  /** Selectable options (grit sizes, grid counts, …) — included in the WhatsApp inquiry. */
  variants?: string[];
  /** Image URL (Supabase Storage) or a path under /public. Cards fall back to a category illustration when absent. */
  image?: string;
  flagship?: boolean;
}

export const CATEGORY_IDS: CategoryId[] = ["torches", "optical", "scales", "lapidary", "accessories"];

/** A row of the `products` table (see supabase/schema.sql). */
export interface ProductRow {
  id: string;
  sku: string;
  name: string;
  category: CategoryId;
  description: string;
  features: string[];
  variants: string[];
  /** Storage object path, a /public path, or an absolute URL. */
  image: string | null;
  flagship: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** What the hero and Flagship section need to build a WhatsApp inquiry. */
export type ProductRef = Pick<Product, "name" | "sku">;
