import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import AuthCard from "@/components/admin/AuthCard";
import TwoStepSetupForm from "@/components/admin/TwoStepSetupForm";
import { getAdminSession } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Set up two-step sign-in" };

export default async function TwoStepSetupPage() {
  const { hasAuthenticator } = await getAdminSession();
  if (hasAuthenticator) redirect("/admin");

  return (
    <AuthCard
      title="Set up two-step sign-in"
      intro="The admin needs a code from your phone as well as your password, so a leaked password alone can't get in."
      footer={
        <form action={signOut}>
          <button type="submit" className="text-ink/50 transition-colors hover:text-ink">
            Sign out
          </button>
        </form>
      }
    >
      <TwoStepSetupForm />
    </AuthCard>
  );
}
