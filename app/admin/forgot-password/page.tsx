import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/admin/AuthCard";
import ForgotPasswordForm from "@/components/admin/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/admin/forgot-password">) {
  const { error } = await searchParams;

  return (
    <AuthCard
      title="Reset password"
      intro="Enter your admin email and we'll send you a link to choose a new password."
      footer={
        <Link href="/admin/login" className="text-ink/50 transition-colors hover:text-ink">
          ← Back to sign in
        </Link>
      }
    >
      {error === "link" && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          That reset link has expired or was already used. Request a new one below.
        </p>
      )}
      <ForgotPasswordForm />
    </AuthCard>
  );
}
