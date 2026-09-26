import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import AuthCard from "@/components/admin/AuthCard";
import TwoStepVerifyForm from "@/components/admin/TwoStepVerifyForm";
import { getAdminSession } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Two-step sign-in" };

export default async function TwoStepPage({ searchParams }: PageProps<"/admin/two-step">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;

  const { twoStepPassed, hasAuthenticator } = await getAdminSession();
  if (twoStepPassed) redirect(nextPath?.startsWith("/admin") ? nextPath : "/admin");
  if (!hasAuthenticator) redirect("/admin/two-step/setup");

  return (
    <AuthCard
      title="Two-step sign-in"
      intro="Open your authenticator app and enter the 6-digit code for MYNIX."
      footer={
        <form action={signOut}>
          <button type="submit" className="text-ink/50 transition-colors hover:text-ink">
            Sign out
          </button>
        </form>
      }
    >
      <TwoStepVerifyForm next={nextPath} />
      <p className="mt-6 text-[13px] leading-relaxed text-ink/50">
        Lost your phone? Another admin, or whoever manages the Supabase project, can remove your authenticator
        under Authentication → Users so you can set it up again.
      </p>
    </AuthCard>
  );
}
