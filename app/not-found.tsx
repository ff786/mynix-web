import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SiteLayout from "@/app/(site)/layout";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page doesn't exist. Browse MYNIX gemology tools or head back home.",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <SiteLayout>
      <main
        data-theme="dark"
        data-section-bg="#050505"
        className="flex min-h-screen items-center px-6 pb-24 pt-36 sm:px-10"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Error 404</p>
          <h1 className="mt-6 text-5xl font-semibold uppercase leading-[0.9] tracking-tighter text-white/90 sm:text-7xl">
            Lost in the loupe.
          </h1>
          <p className="mx-auto mt-6 max-w-md leading-relaxed text-white/60">
            We couldn&apos;t find that page. It may have moved, or the link may be mistyped.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/catalog" size="lg">
              Shop the catalog
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/" variant="secondary" size="lg">
              Back to home
            </Button>
          </div>
          <p className="mt-10 text-sm text-white/40">
            Looking for an order?{" "}
            <Link href="/track" className="underline underline-offset-4 hover:text-white">
              Track it here
            </Link>
            .
          </p>
        </div>
      </main>
    </SiteLayout>
  );
}
