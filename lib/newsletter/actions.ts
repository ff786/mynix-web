"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { posRequest } from "@/lib/pos/client";

export type NewsletterState = { status: "idle" | "success" | "error"; message?: string };

/**
 * Newsletter sign-up. Subscribers are stored in the MYNIX database through
 * the POS, which de-duplicates, rate-limits and texts the shop about each
 * new subscriber.
 */
export async function subscribeToNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // Honeypot: real visitors never see or fill this field.
  if (String(formData.get("company") ?? "")) return { status: "success", message: "You're on the list." };

  const email = z.email().max(254).safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { status: "error", message: "Please enter a valid email address." };

  // Only a one-way hash of the visitor's IP is sent, for rate limiting.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const visitorHash = createHash("sha256").update(`mynix-newsletter:${ip}`).digest("hex");

  try {
    const { status } = await posRequest<{ status: "SUBSCRIBED" | "ALREADY_SUBSCRIBED" | "THROTTLED" }>(
      "/store/newsletter",
      { method: "POST", body: { email: email.data, visitorHash } },
    );
    if (status === "THROTTLED") return { status: "error", message: "Too many attempts — please try again in a few minutes." };
    if (status === "ALREADY_SUBSCRIBED") return { status: "success", message: "You're already on the list. Thank you." };
    return { status: "success", message: "You're on the list. Thank you." };
  } catch (error) {
    console.error("[newsletter] Sign-up failed:", error instanceof Error ? error.message : error);
    return { status: "error", message: "Sign-ups are unavailable right now. Please try again later." };
  }
}
