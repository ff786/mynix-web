import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { signOut } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { email } = await requireAdmin();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-[#f5f5f7]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-[15px] font-semibold uppercase tracking-[0.42em]">
              Mynix
            </Link>
            <nav className="hidden items-center gap-6 text-sm sm:flex">
              <Link href="/admin" className="text-ink/70 transition-colors hover:text-ink">
                Products
              </Link>
              <Link href="/admin/subscribers" className="text-ink/70 transition-colors hover:text-ink">
                Subscribers
              </Link>
              <Link href="/admin/security" className="text-ink/70 transition-colors hover:text-ink">
                Security
              </Link>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-ink/70 transition-colors hover:text-ink"
              >
                View site <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-ink/50 md:inline">{email}</span>
            <form action={signOut}>
              <button type="submit" className="text-ink/70 transition-colors hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">{children}</main>
    </>
  );
}
