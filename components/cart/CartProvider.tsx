"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

/**
 * The shopping cart, kept in this browser only (website product ids and
 * quantities). Prices and availability are always re-checked on the server
 * at checkout, so nothing here is trusted.
 */
export type CartLine = { id: string; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  /** False during the first (server-matching) render, before the saved cart is read. */
  ready: boolean;
  add: (id: string, quantity: number, max: number) => void;
  setQuantity: (id: string, quantity: number, max: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "mynix-cart-v1";
const EMPTY: CartLine[] = [];

/* --- browser storage, shared by every tab -------------------------------- */

const listeners = new Set<() => void>();
let memoryRaw: string | null = null; // used when localStorage is unavailable (private mode)
let cachedRaw: string | null | undefined;
let cachedLines: CartLine[] = EMPTY;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryRaw;
  }
}

function parse(raw: string | null): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed
      .filter((l): l is CartLine => typeof l?.id === "string" && Number.isInteger(l?.quantity) && l.quantity > 0)
      .slice(0, 30);
  } catch {
    return EMPTY;
  }
}

/** Stable snapshot: re-parsed only when the stored text changes. */
function getSnapshot(): CartLine[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLines = parse(raw);
  }
  return cachedLines;
}

function write(lines: CartLine[]) {
  const raw = JSON.stringify(lines);
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    memoryRaw = raw;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const noopSubscribe = () => () => {};
const clamp = (value: number, max: number) => Math.max(0, Math.min(Math.floor(value), max));

/* --- React ------------------------------------------------------------------ */

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const add = useCallback((id: string, quantity: number, max: number) => {
    const current = getSnapshot();
    const existing = current.find((l) => l.id === id);
    const next = clamp((existing?.quantity ?? 0) + quantity, max);
    if (next === 0) return write(current.filter((l) => l.id !== id));
    write(existing ? current.map((l) => (l.id === id ? { id, quantity: next } : l)) : [...current, { id, quantity: next }]);
  }, []);

  const setQuantity = useCallback((id: string, quantity: number, max: number) => {
    const next = clamp(quantity, max);
    const current = getSnapshot();
    write(next === 0 ? current.filter((l) => l.id !== id) : current.map((l) => (l.id === id ? { id, quantity: next } : l)));
  }, []);

  const remove = useCallback((id: string) => write(getSnapshot().filter((l) => l.id !== id)), []);
  const clear = useCallback(() => write([]), []);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((sum, l) => sum + l.quantity, 0), ready, add, setQuantity, remove, clear }),
    [lines, ready, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
