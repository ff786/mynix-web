/* -------------------------------------------------------------------------- */
/*  Storefront products — safe to send to browsers                            */
/* -------------------------------------------------------------------------- */

/**
 * A product on the website. Name, category, price and availability come from
 * the POS; description, features and photo from the website's own content.
 * Never carries POS identifiers (barcode, internal id) or stock counts.
 */
export interface Product {
  /** Website id: the product page address set in the POS (/products/{id}). */
  id: string;
  /** Full product name from the POS. */
  name: string;
  /** Category slug, derived from the POS category name. */
  category: string;
  categoryName: string;
  /** Selling price in LKR. */
  price: number;
  inStock: boolean;
  /** Most a customer can order at once (limited by stock). */
  maxQuantity: number;
  /** Detailed description: blank lines split paragraphs, "- " lines are bullets. */
  description: string;
  /** First paragraph as plain text, for cards. */
  summary: string;
  features: string[];
  /** Website URL of the main photo; cards fall back to a category illustration. */
  image?: string;
  /** Photos and videos in display order, including options' "All options" media. */
  media: ProductMedia[];
  /** Text describing the photo (defaults to the name). */
  imageAlt?: string;
  /** Set when this product is one option of a variable product (colour, size…). */
  variant?: ProductVariant;
  flagship?: boolean;
}

/** A POS category that has products on the website. */
/**
 * One gallery item. Photos are served from this website (/media/products/…);
 * uploaded videos from the public media storage; YouTube by video id.
 */
export type ProductMedia =
  | { type: "image"; src: string; alt?: string; shared: boolean }
  | { type: "video"; src: string; shared: boolean }
  | { type: "youtube"; id: string; shared: boolean };

export interface ProductVariant {
  /** Opaque group key (never the POS id); options of one listing share it. */
  group: string;
  /** Listing name, e.g. "Gem Box 2x2". */
  groupName: string;
  /** What the options are, e.g. "Colour". */
  optionName: string;
  /** This product's option, e.g. "Black". */
  label: string;
}

export interface ProductCategory {
  /** URL slug: /catalog?category={id}. */
  id: string;
  name: string;
  /** Products in it that the website shows. */
  count: number;
  /** Short highlights from data/ranges.ts (may be empty). */
  highlights: string[];
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
