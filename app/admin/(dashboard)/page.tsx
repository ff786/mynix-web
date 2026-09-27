import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminHomePage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { twostep, password } = await searchParams;
  const notice =
    twostep === "on"
      ? "Two-step sign-in is on. You'll need a code from your authenticator app each time you sign in."
      : password === "changed"
        ? "Your password has been changed."
        : null;

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Website admin</h1>
      <p className="mt-2 max-w-2xl text-ink/60">
        Products, prices, stock and online orders are managed in the MYNIX POS — the website shows them
        automatically, and every online order appears there as a sale.
      </p>

      {notice && (
        <p role="status" className="mt-8 rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm text-ink/80">
          {notice}
        </p>
      )}

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {[
          { href: "/admin/subscribers", title: "Subscribers", text: "Everyone who joined the newsletter." },
          { href: "/admin/security", title: "Security", text: "Password and two-step sign-in." },
        ].map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group flex h-full items-center justify-between gap-4 rounded-3xl border border-ink/10 bg-white p-6 transition-colors hover:border-ink/25"
            >
              <span>
                <span className="block font-semibold">{item.title}</span>
                <span className="mt-1 block text-sm text-ink/60">{item.text}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink/40 transition-transform group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
