/* -------------------------------------------------------------------------- */
/*  Storefront products — safe to send to browsers                            */
/* -------------------------------------------------------------------------- */

/**
 * A product on the website. Name, category, price and availability come from
 * the POS; description, features and photo from the website's own content.
 * Never carries POS identifiers (barcode, internal id) or stock counts.
 */
export interface Product {
  /** Website id (URL slug). */
  id: string;
  name: string;
  /** Category slug, derived from the POS category name. */
  category: string;
  categoryName: string;
  /** Selling price in LKR. */
  price: number;
  inStock: boolean;
  /** Most a customer can order at once (limited by stock). */
  maxQuantity: number;
  description: string;
  features: string[];
  /** Website URL of the photo; cards fall back to a category illustration. */
  image?: string;
  flagship?: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
}

/** What the hero and Flagship section need to link to the flagship product. */
export type ProductRef = Pick<Product, "id" | "name">;

/* -------------------------------------------------------------------------- */
/*  Website-written content (data/products.ts), matched to POS products        */
/* -------------------------------------------------------------------------- */

export type ContentCategoryId = "torches" | "optical" | "scales" | "lapidary" | "accessories";

export interface ContentCategory {
  id: ContentCategoryId;
  /** Short label used on filter tabs. */
  label: string;
  /** Full name used in headings and badges. */
  title: string;
  description: string;
}

export interface ProductContent {
  sku: string;
  /** Matched against the POS product name (case and punctuation ignored). */
  name: string;
  category: ContentCategoryId;
  /** One-line summary shown on the card. */
  description: string;
  /** Bullet points shown in the quick-view modal. */
  features: string[];
  variants?: string[];
  /** A path under /public. */
  image?: string;
  flagship?: boolean;
}
