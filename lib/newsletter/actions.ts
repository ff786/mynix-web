"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

export type NewsletterState = { status: "idle" | "success" | "error"; message?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type SubscribeResult = "subscribed" | "already-subscribed" | "invalid" | "throttled";

/**
 * Newsletter sign-up. Subscribers are stored in Supabase through
 * `subscribe_newsletter()`, which de-duplicates and rate-limits in the database
 * (so limits hold across server instances). New subscribers are also emailed to
 * the site owner via Resend when RESEND_API_KEY and NEWSLETTER_NOTIFY_EMAIL are set.
 */
export async function subscribeToNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // Honeypot: real visitors never see or fill this field.
  if (String(formData.get("company") ?? "")) return { status: "success", message: "You're on the list." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  if (!isSupabaseConfigured) {
    console.error("[newsletter] Supabase is not configured.");
    return { status: "error", message: "Sign-ups are unavailable right now. Please try again later." };
  }

  // Only a one-way hash of the visitor's IP is stored, for rate limiting.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const visitorHash = createHash("sha256").update(`mynix-newsletter:${ip}`).digest("hex");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("subscribe_newsletter", { p_email: email, p_visitor_hash: visitorHash });
  if (error) {
    console.error("[newsletter] subscribe_newsletter failed:", error.message);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  switch (data as SubscribeResult) {
    case "invalid":
      return { status: "error", message: "Please enter a valid email address." };
    case "throttled":
      return { status: "error", message: "Too many attempts — please try again in a few minutes." };
    case "already-subscribed":
      return { status: "success", message: "You're already on the list. Thank you." };
  }

  await notifyOwner(email);
  return { status: "success", message: "You're on the list. Thank you." };
}

/** Best effort: the subscriber is already saved, so a failed email is only logged. */
async function notifyOwner(email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const notify = process.env.NEWSLETTER_NOTIFY_EMAIL;
  const from = process.env.NEWSLETTER_FROM_EMAIL || "MYNIX Website <onboarding@resend.dev>";
  if (!apiKey || !notify) return;

  const signedUpAt = new Date().toLocaleString("en-GB", { timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short" });

  try {
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
    if (!response.ok) console.error("[newsletter] Resend request failed:", response.status, await response.text());
  } catch (err) {
    console.error("[newsletter] Resend request failed:", err);
  }
}
