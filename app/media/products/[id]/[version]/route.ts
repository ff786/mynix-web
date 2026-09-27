import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { getCatalogEntries } from "@/lib/catalog";

/**
 * Serves a product photo from this website's own address, so visitors never
 * see where it's stored. The link comes from the POS, where staff type it in,
 * so it's fetched defensively: https only, public addresses only (no internal
 * or cloud-metadata hosts), raster images only (no SVG), size and time limits.
 */
export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export async function GET(_request: Request, { params }: RouteContext<"/media/products/[id]/[version]">) {
  const { id } = await params;
  const entry = (await getCatalogEntries().catch(() => [])).find((e) => e.product.id === id);
  if (!entry?.posImageUrl) return notFound();

  try {
    const upstream = await fetchPublicImage(entry.posImageUrl);
    const declared = upstream.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
    // Some shops send the non-standard "image/jpg".
    const type = declared === "image/jpg" || declared === "image/pjpeg" ? "image/jpeg" : declared;
    if (!upstream.ok || !ALLOWED_TYPES.has(type)) return notFound();

    const body = await readLimited(upstream, MAX_BYTES);
    return new Response(body as Uint8Array<ArrayBuffer>, {
      headers: {
        "Content-Type": type,
        // The URL changes whenever the photo link does, so it can be cached for long.
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return notFound();
  }
}

const notFound = () => new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=300" } });

/** Follows at most 3 redirects, re-checking every hop. */
async function fetchPublicImage(url: string): Promise<Response> {
  let current = new URL(url);
  for (let hop = 0; hop < 4; hop++) {
    await assertPublicHttps(current);
    const res = await fetch(current, {
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif" },
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current);
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}

async function assertPublicHttps(url: URL) {
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Blocked URL");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Blocked address");
  }
}

function isPrivateAddress(address: string): boolean {
  const v4 = address.startsWith("::ffff:") ? address.slice(7) : address;
  if (isIP(v4) === 4) {
    const [a, b] = v4.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
      (a === 169 && b === 254) || // link-local / cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224 // multicast / reserved
    );
  }
  const v6 = address.toLowerCase();
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function readLimited(res: Response, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > limit) throw new Error("Too large");
  const reader = res.body!.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Error("Too large");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}
