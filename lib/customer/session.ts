import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Customer sessions and phone-verification proofs, kept in signed HttpOnly
 * cookies (CUSTOMER_SESSION_SECRET). Browser scripts can't read them, and
 * they can't be forged or edited without the secret.
 */
const SECRET = process.env.CUSTOMER_SESSION_SECRET ?? "";
export const customerAccountsEnabled = SECRET.length >= 32;

const SESSION_COOKIE = "mynix_customer";
const SESSION_DAYS = 30;
export type VerifyPurpose = "CHECKOUT" | "ACCOUNT";
const verifyCookie = (purpose: VerifyPurpose) => `mynix_verify_${purpose.toLowerCase()}`;

export type CustomerSession = { customerId: number; phone: string; name: string };
type Verification = { token: string; phone: string };

function sign(payload: object, expiresInSeconds: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds })).toString(
    "base64url",
  );
  return `${body}.${createHmac("sha256", SECRET).update(body).digest("base64url")}`;
}

function verify<T>(value: string | undefined): T | null {
  if (!value || !customerAccountsEnabled) return null;
  const [body, mac] = value.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", SECRET).update(body).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as T & { exp: number };
    return data.exp > Date.now() / 1000 ? data : null;
  } catch {
    return null;
  }
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export async function getCustomerSession(): Promise<CustomerSession | null> {
  return verify<CustomerSession>((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Only in Server Actions / Route Handlers. */
export async function setCustomerSession(session: CustomerSession) {
  const maxAge = SESSION_DAYS * 24 * 3600;
  (await cookies()).set(SESSION_COOKIE, sign(session, maxAge), cookieOptions(maxAge));
}

export async function clearCustomerSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Remembers a verified number for 15 minutes (matching the POS token's lifetime). */
export async function setVerification(purpose: VerifyPurpose, verification: Verification) {
  (await cookies()).set(verifyCookie(purpose), sign(verification, 15 * 60), cookieOptions(15 * 60));
}

export async function getVerification(purpose: VerifyPurpose): Promise<Verification | null> {
  return verify<Verification>((await cookies()).get(verifyCookie(purpose))?.value);
}

export async function clearVerification(purpose: VerifyPurpose) {
  (await cookies()).delete(verifyCookie(purpose));
}
