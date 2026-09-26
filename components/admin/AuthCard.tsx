import type { ReactNode } from "react";
import Link from "next/link";

type AuthCardProps = {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  /** Link under the card; defaults to "Back to the website". */
  footer?: ReactNode;
};

/** Centered card shared by sign-in, two-step and password pages. */
export default function AuthCard({ title, intro, children, footer }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="text-center text-[15px] font-semibold uppercase tracking-[0.42em]">Mynix</p>
        <h1 className="mt-10 text-center text-3xl font-semibold tracking-tight">{title}</h1>
        {intro && <p className="mt-3 text-center text-[15px] leading-relaxed text-ink/60">{intro}</p>}

        <div className="mt-10 rounded-3xl border border-ink/10 bg-white p-8 shadow-[0_20px_50px_-30px_rgba(29,29,31,0.25)]">
          {children}
        </div>

        <div className="mt-8 text-center text-sm">
          {footer ?? (
            <Link href="/" className="text-ink/50 transition-colors hover:text-ink">
              ← Back to the website
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
