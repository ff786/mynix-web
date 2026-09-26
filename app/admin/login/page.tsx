import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/admin/actions";
import AuthCard from "@/components/admin/AuthCard";
import LoginForm from "@/components/admin/LoginForm";
import { buttonClasses } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { error } = await searchParams;

  return (
    <AuthCard title="Admin sign in">
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
        <>
          <LoginForm />
          <p className="mt-5 text-center text-sm">
            <Link href="/admin/forgot-password" className="text-ink/50 transition-colors hover:text-ink">
              Forgot password?
            </Link>
          </p>
        </>
      )}
    </AuthCard>
  );
}
