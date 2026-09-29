import "server-only";

/**
 * Server-only client for the POS backend's online-store API (role
 * ONLINE_STORE). Browsers never talk to the POS: they only ever see this
 * website's own pages and routes.
 */
const API_URL = process.env.POS_API_URL ?? "";
const USERNAME = process.env.POS_STORE_USERNAME ?? "";
const PASSWORD = process.env.POS_STORE_PASSWORD ?? "";
/**
 * Key for the website's direct address to the POS (store-api.mynix.lk, which
 * skips Cloudflare): the server answers only requests that carry it.
 */
const STORE_KEY = process.env.POS_STORE_KEY ?? "";
const keyHeader: Record<string, string> = STORE_KEY ? { "X-Mynix-Store-Key": STORE_KEY } : {};

export const isPosConfigured = Boolean(API_URL && USERNAME && PASSWORD);

// The store password travels with every sign-in: plain http only for a POS on this machine.
if (isPosConfigured && !/^https:\/\/|^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(API_URL)) {
  throw new Error("POS_API_URL must use https (http is allowed only for localhost).");
}

export class PosError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

let session: { token: string; expiresAt: number } | null = null;

/** Signs in with the store account; the token is reused until shortly before it expires. */
async function getToken(): Promise<string> {
  if (session && Date.now() < session.expiresAt - 60_000) return session.token;

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...keyHeader },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new PosError(res.status, "Store sign-in to the POS failed");

  const { token } = (await res.json()) as { token: string };
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as { exp?: number };
  session = { token, expiresAt: (payload.exp ?? Date.now() / 1000 + 300) * 1000 };
  return token;
}

/** JSON request to the POS store API, e.g. posRequest("/store/products"). */
export async function posRequest<T>(path: `/store/${string}`, init: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!isPosConfigured) throw new PosError(503, "POS is not configured");

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        ...keyHeader,
        Authorization: `Bearer ${await getToken()}`,
        ...(init.body !== undefined && { "Content-Type": "application/json" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    // A rejected token (expired or rotated): sign in again once.
    if ((res.status === 401 || res.status === 403) && attempt === 0) {
      session = null;
      continue;
    }

    const data = (await res.json().catch(() => null)) as (T & { message?: string }) | null;
    if (!res.ok) throw new PosError(res.status, data?.message ?? `POS request failed (${res.status})`);
    return data as T;
  }
  throw new PosError(403, "POS refused the store account");
}
