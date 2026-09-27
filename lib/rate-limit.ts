import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Per-server-instance limits: a first line of defence. The POS enforces the
 * limits that matter (SMS codes per number) in its database.
 */
const hits = new Map<string, number[]>();

export function limited(key: string, max: number, minutes: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < minutes * 60_000);
  const blocked = recent.length >= max;
  if (!blocked) recent.push(now);
  hits.set(key, recent);
  return blocked;
}

/** A hashed visitor id from the client IP (the IP itself isn't kept). */
export async function visitorKey(): Promise<string> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(`mynix:${ip}`).digest("hex").slice(0, 32);
}
