"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";
import { getConsent, getServerConsent, setConsent, subscribeConsent } from "@/components/consent/consentStore";

/**
 * Cookie banner. Essential storage (sign-in, cart) always runs; the cookieless
 * Vercel Web Analytics loads only after the visitor accepts.
 */
export default function CookieConsent() {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, getServerConsent);

  if (consent === "granted") return <Analytics />;
  if (consent !== null) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#111]/95 p-5 text-sm text-white/70 shadow-2xl backdrop-blur-md sm:inset-x-6 sm:bottom-6"
    >
      <p className="leading-relaxed">
        We use essential cookies to keep you signed in and remember your cart. With your permission, we&apos;d also like
        to count visits anonymously to improve the site.{" "}
        <Link href="/privacy" className="text-white underline underline-offset-4">
          Privacy Policy
        </Link>
      </p>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => setConsent("denied")}
          className="rounded-full border border-white/20 px-5 py-2.5 font-medium text-white/80 transition-colors hover:text-white"
        >
          Essential only
        </button>
        <button
          type="button"
          onClick={() => setConsent("granted")}
          className="rounded-full bg-white px-5 py-2.5 font-medium text-[#1d1d1f] transition-opacity hover:opacity-90"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
