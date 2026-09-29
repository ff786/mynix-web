import type { Product, ProductMedia } from "@/types/product";

/**
 * What the catalog shows as one card: a standalone product, or all the
 * options (colours, sizes…) of a variable product.
 */
export type Listing = {
  /** Variant group key, or the product id when standalone. */
  key: string;
  name: string;
  /** Options sorted by label ("4x6cm" before "10x10cm"); one entry when standalone. */
  products: Product[];
  /** Shown on the card and opened first: the first option in stock. */
  lead: Product;
  /** Lowest and highest option price. */
  minPrice: number;
  maxPrice: number;
};

const firstNumber = (label: string) => {
  const match = label.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};

/** By the option's number when both have one ("#600" before "1200#"), else A–Z. */
const listingKey = (product: Product) =>
  product.variant ? `${product.category}:${product.variant.group}` : product.id;

const byLabel = (a: Product, b: Product) => {
  const [x, y] = [a.variant?.label ?? "", b.variant?.label ?? ""];
  if (x === "Standard" || y === "Standard") return x === "Standard" ? -1 : 1;
  const [nx, ny] = [firstNumber(x), firstNumber(y)];
  if (nx !== null && ny !== null && nx !== ny) return nx - ny;
  return x.localeCompare(y, undefined, { numeric: true, sensitivity: "base" });
};

/** Groups options of the same variable product (within a category), keeping catalog order. */
export function groupListings(products: Product[]): Listing[] {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = listingKey(product);
    const group = groups.get(key);
    if (group) group.push(product);
    else groups.set(key, [product]);
  }

  return [...groups].map(([key, group]) => {
    const options = group.length > 1 ? [...group].sort(byLabel) : group;
    const lead = options.find((p) => p.inStock) ?? options[0];
    const prices = options.map((p) => p.price);
    return {
      key,
      name: options.length > 1 ? lead.variant!.groupName : lead.name,
      products: options,
      lead,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  });
}

const mediaKey = (m: ProductMedia) => (m.type === "youtube" ? `yt:${m.id}` : m.src);

/**
 * Adds each option's "All options" media to the other options of the same
 * listing, after their own media (no duplicates).
 */
export function withSharedMedia(products: Product[]): Product[] {
  const sharedByListing = new Map<string, ProductMedia[]>();
  for (const listing of groupListings(products)) {
    if (listing.products.length < 2) continue;
    sharedByListing.set(listing.key, listing.products.flatMap((p) => p.media.filter((m) => m.shared)));
  }
  if (sharedByListing.size === 0) return products;

  return products.map((product) => {
    const shared = product.variant ? sharedByListing.get(listingKey(product)) : undefined;
    if (!shared?.length) return product;
    const seen = new Set(product.media.map(mediaKey));
    const extra = shared.filter((m) => !seen.has(mediaKey(m)) && seen.add(mediaKey(m)));
    return extra.length ? { ...product, media: [...product.media, ...extra] } : product;
  });
}

/** The other options of a product's variable product (including itself), sorted; [product] when standalone. */
export function optionsOf(product: Product, products: Product[]): Product[] {
  if (!product.variant) return [product];
  const options = products.filter(
    (p) => p.variant?.group === product.variant!.group && p.category === product.category,
  );
  return options.length > 1 ? options.sort(byLabel) : [product];
}
