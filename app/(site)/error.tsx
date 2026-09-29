"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Friendly page for unexpected errors inside the site (the header and footer stay). */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main data-theme="dark" data-section-bg="#050505" className="flex min-h-screen items-center px-6 pb-24 pt-36 sm:px-10">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">Something went wrong</p>
        <h1 className="mt-6 text-4xl font-semibold uppercase leading-[0.95] tracking-tighter text-white/90 sm:text-6xl">
          Let&apos;s try that again.
        </h1>
        <p className="mx-auto mt-6 max-w-md leading-relaxed text-white/60">
          This page hit an unexpected problem. Your cart is safe. Please try again, or contact us on WhatsApp if it keeps
          happening.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-[#1d1d1f] hover:opacity-90"
          >
            Try again
          </button>
          <Link href="/" className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white/80 hover:text-white">
            Back to home
          </Link>
        </div>
        {error.digest && <p className="mt-8 text-xs text-white/30">Reference: {error.digest}</p>}
      </div>
    </main>
  );
}
