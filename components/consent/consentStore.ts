/**
 * The visitor's analytics choice, kept in localStorage ("granted" / "denied").
 * null means they haven't chosen yet, so the banner shows.
 */
export type Consent = "granted" | "denied" | null;

const STORAGE_KEY = "mynix-consent";
const listeners = new Set<() => void>();
let memory: Consent = null; // used when localStorage is unavailable (private mode)

export function getConsent(): Consent {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return memory;
  }
}

/** On the server the banner stays hidden, so it never flashes before hydration. */
export const getServerConsent = (): Consent | "unknown" => "unknown";

export function setConsent(value: Consent) {
  memory = value;
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode: the in-memory choice lasts for this visit.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeConsent(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
