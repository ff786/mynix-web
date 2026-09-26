import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { replaceAuthenticator } from "@/app/admin/account-actions";
import PasswordForm from "@/components/admin/PasswordForm";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Security" };

export default async function AdminSecurityPage() {
  const { email } = await requireAdmin();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Security</h1>
      <p className="mt-2 text-ink/60">Signed in as {email}.</p>

      <section className="mt-10 rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <h2 className="text-lg font-semibold">Two-step sign-in is on</h2>
            <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-ink/60">
              Signing in needs your password and a code from your authenticator app. Got a new phone? Set up the
              new one here. Your current app stops working as soon as you continue.
            </p>
          </div>
        </div>
        <form action={replaceAuthenticator} className="mt-6">
          <button
            type="submit"
            className="rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink/40"
          >
            Set up a new authenticator
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Change password</h2>
        <div className="mt-6 max-w-sm">
          <PasswordForm mode="change" />
        </div>
      </section>
    </>
  );
}
