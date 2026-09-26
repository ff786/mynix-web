import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthCard from "@/components/admin/AuthCard";
import PasswordForm from "@/components/admin/PasswordForm";
import { getAdminSession } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  const { hasAuthenticator, twoStepPassed } = await getAdminSession();
  // The emailed link alone isn't enough when two-step sign-in is on.
  if (hasAuthenticator && !twoStepPassed) redirect("/admin/two-step?next=/admin/reset-password");

  return (
    <AuthCard title="Choose a new password">
      <PasswordForm mode="reset" />
    </AuthCard>
  );
}
