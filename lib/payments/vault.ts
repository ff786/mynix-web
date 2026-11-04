import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Seals data for the round trip through a customer's browser and OnePay
 * (AES-256-GCM, key derived from PAYMENT_STATE_SECRET). The result is unreadable
 * and can't be edited or forged without the secret, so it is safe to hold in a
 * cookie or in OnePay's pass-through field. Every payload expires.
 */
const SECRET = process.env.PAYMENT_STATE_SECRET ?? "";
export const vaultEnabled = SECRET.length >= 32;

const key = vaultEnabled
  ? Buffer.from(hkdfSync("sha256", SECRET, "mynix-payment-vault", "aes-256-gcm", 32))
  : null;

export function seal(payload: object, ttlSeconds: number): string {
  if (!key) throw new Error("PAYMENT_STATE_SECRET is not configured");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds });
  const encrypted = Buffer.concat([cipher.update(body, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

/** The payload, or null if it was tampered with, expired or isn't ours. */
export function open<T>(sealed: string | undefined | null): T | null {
  if (!key || !sealed || sealed.length > 8_000) return null;
  try {
    const raw = Buffer.from(sealed, "base64url");
    if (raw.length < 29) return null;
    const decipher = createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const body = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    const data = JSON.parse(body) as T & { exp: number };
    return data.exp > Date.now() / 1000 ? data : null;
  } catch {
    return null;
  }
}
