import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/admin/actions";
import LoginForm from "@/components/admin/LoginForm";
import { buttonClasses } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="text-center text-[15px] font-semibold uppercase tracking-[0.42em]">Mynix</p>
        <h1 className="mt-10 text-center text-3xl font-semibold tracking-tight">Admin sign in</h1>

        <div className="mt-10 rounded-3xl border border-ink/10 bg-white p-8 shadow-[0_20px_50px_-30px_rgba(29,29,31,0.25)]">
          {!isSupabaseConfigured ? (
            <p className="text-sm leading-relaxed text-ink/70">
              The admin isn&apos;t connected to a database yet. Add your Supabase keys to the environment
              (see <code className="rounded bg-ink/5 px-1.5 py-0.5 text-[13px]">ADMIN_SETUP.md</code>) and restart.
            </p>
          ) : error === "not-admin" ? (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-ink/70">
                This account isn&apos;t on the admin list. Ask the site owner to add it, or sign in with a different
                account.
              </p>
              <form action={signOut}>
                <button type="submit" className={buttonClasses({ variant: "secondary", className: "w-full" })}>
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <LoginForm />
          )}
        </div>

        <p className="mt-8 text-center text-sm">
          <Link href="/" className="text-ink/50 transition-colors hover:text-ink">
            ← Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
