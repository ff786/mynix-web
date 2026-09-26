"use server";

import { headers } from "next/headers";

export type NewsletterState = { status: "idle" | "success" | "error"; message?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Light per-instance throttle: 5 sign-ups per visitor per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function throttled(key: string) {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  return hits.length > MAX_PER_WINDOW;
}

/**
 * Newsletter sign-up: emails the site owner about each new subscriber via
 * Resend (RESEND_API_KEY, NEWSLETTER_NOTIFY_EMAIL, NEWSLETTER_FROM_EMAIL).
 */
export async function subscribeToNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // Honeypot: real visitors never see or fill this field.
  if (String(formData.get("company") ?? "")) return { status: "success", message: "You're on the list." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  const requestHeaders = await headers();
  const visitor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttled(visitor)) {
    return { status: "error", message: "Too many attempts — please try again in a few minutes." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notify = process.env.NEWSLETTER_NOTIFY_EMAIL;
  const from = process.env.NEWSLETTER_FROM_EMAIL || "MYNIX Website <onboarding@resend.dev>";
  if (!apiKey || !notify) {
    console.error("[newsletter] RESEND_API_KEY or NEWSLETTER_NOTIFY_EMAIL is not set.");
    return { status: "error", message: "Sign-ups are unavailable right now. Please try again later." };
  }

  const signedUpAt = new Date().toLocaleString("en-GB", { timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short" });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [notify],
      reply_to: email,
      subject: `New newsletter subscriber: ${email}`,
      text: `${email} subscribed to the MYNIX newsletter on ${signedUpAt} (Sri Lanka time).\n\nReply to this email to write to them directly.`,
    }),
  });

  if (!response.ok) {
    console.error("[newsletter] Resend request failed:", response.status, await response.text());
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  return { status: "success", message: "You're on the list. Thank you." };
}
