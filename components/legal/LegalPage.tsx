import type { ReactNode } from "react";

/** Shared layout for the privacy and terms pages: readable prose on the dark theme. */
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main data-theme="dark" data-section-bg="#050505" className="min-h-screen px-6 pb-24 pt-36 sm:px-10 sm:pt-44">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-semibold uppercase tracking-tighter text-white/90 sm:text-6xl">{title}</h1>
        <p className="mt-4 text-sm text-white/45">Last updated {updated}</p>
        <div className="mt-12 space-y-10 leading-relaxed text-white/70 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white/90 [&_li]:mt-2 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </main>
  );
}
