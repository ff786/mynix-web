import type { ProductRef } from "@/types/product";

/** Catalog with the flagship's details open, ready to add to the cart. */
export const flagshipHref = (flagship: ProductRef) =>
  flagship.id ? `/catalog?product=${encodeURIComponent(flagship.id)}` : "/catalog";
