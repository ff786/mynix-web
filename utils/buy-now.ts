/**
 * "Buy now" checks out one product from the address bar and leaves the saved
 * cart alone. Prices and availability are re-checked on the server as usual.
 */
export type BuyNowLine = { id: string; quantity: number };

export const buyNowHref = ({ id, quantity }: BuyNowLine) => `/checkout?buy=${encodeURIComponent(id)}&qty=${quantity}`;

export function parseBuyNow(buy: unknown, qty: unknown): BuyNowLine | null {
  if (typeof buy !== "string" || !/^[a-z0-9-]+$/.test(buy)) return null;
  const quantity = typeof qty === "string" && /^[1-9][0-9]{0,3}$/.test(qty) ? Number(qty) : 1;
  return { id: buy, quantity };
}

/* The trip to OnePay loses the address, so this tab remembers which checkout is being paid for. */
const STORAGE_KEY = "mynix-buy-now-checkout";

export function rememberBuyNow(line: BuyNowLine | null) {
  try {
    if (line) sessionStorage.setItem(STORAGE_KEY, buyNowHref(line));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode: the customer comes back to the cart's checkout instead.
  }
}

export function rememberedBuyNow(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
