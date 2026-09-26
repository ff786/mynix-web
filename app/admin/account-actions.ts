"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession, requireAdmin } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/* -------------------------------------------------------------------------- */
/*  Two-step sign-in (authenticator app, TOTP)                                 */
/* -------------------------------------------------------------------------- */

export type CodeState = { error?: string };
export type SetupState = { error?: string; factorId?: string; qrCode?: string; secret?: string };

const readCode = (formData: FormData) => String(formData.get("code") ?? "").replace(/\s+/g, "");
const isCode = (code: string) => /^\d{6}$/.test(code);

/** Only return to pages inside the admin after verifying. */
function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "");
  return /^\/admin(\/[a-z0-9/-]*)?$/.test(next) ? next : "/admin";
}

/** Second step of sign-in: check the 6-digit code from the authenticator app. */
export async function verifyTwoStep(_prev: CodeState, formData: FormData): Promise<CodeState> {
  const { supabase, authenticatorId, twoStepPassed } = await getAdminSession();
  const next = safeNext(formData.get("next"));
  if (twoStepPassed) redirect(next);
  if (!authenticatorId) redirect("/admin/two-step/setup");

  const code = readCode(formData);
  if (!isCode(code)) return { error: "Enter the 6-digit code from your authenticator app." };

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: authenticatorId, code });
  if (error) return { error: "That code didn't work. Codes change every 30 seconds — try the current one." };

  redirect(next);
}

/** Setup form: first shows the QR code, then checks the first code. */
export async function twoStepSetup(prev: SetupState, formData: FormData): Promise<SetupState> {
  return formData.get("intent") === "start" ? startTwoStepSetup() : confirmTwoStepSetup(prev, formData);
}

/** Creates a new authenticator and returns its QR code. */
async function startTwoStepSetup(): Promise<SetupState> {
  const { supabase, hasAuthenticator } = await getAdminSession();
  if (hasAuthenticator) redirect("/admin");

  // Clear any half-finished setups so they don't pile up.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.all ?? []) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `MYNIX admin ${new Date().toISOString()}`,
  });
  if (error || !data) return { error: `Couldn't start setup: ${error?.message ?? "unknown error"}` };

  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

/** The first code proves the app is set up correctly. */
async function confirmTwoStepSetup(prev: SetupState, formData: FormData): Promise<SetupState> {
  const { supabase, hasAuthenticator } = await getAdminSession();
  if (hasAuthenticator) redirect("/admin");
  if (!prev.factorId) return { error: "Start the setup again." };

  const code = readCode(formData);
  if (!isCode(code)) return { ...prev, error: "Enter the 6-digit code from your authenticator app." };

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: prev.factorId, code });
  if (error) return { ...prev, error: "That code didn't work. Check the app shows “MYNIX” and try the current code." };

  redirect("/admin?twostep=on");
}

/** Removes the current authenticator so a new phone can be set up. */
export async function replaceAuthenticator() {
  const { supabase } = await requireAdmin();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.totp ?? []) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) throw new Error(`Couldn't remove the authenticator: ${error.message}`);
  }
  redirect("/admin/two-step/setup");
}

/* -------------------------------------------------------------------------- */
/*  Passwords                                                                  */
/* -------------------------------------------------------------------------- */

export type PasswordState = { error?: string; done?: boolean };

const MIN_PASSWORD = 12;

async function updatePassword(supabase: Awaited<ReturnType<typeof getAdminSession>>["supabase"], formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (password !== confirm) return "The two passwords don't match.";

  const { error } = await supabase.auth.updateUser({ password });
  if (!error) return null;
  if (error.code === "same_password") return "That's your current password. Choose a new one.";
  if (error.code === "weak_password") return "That password is too weak. Try a longer one.";
  return `Couldn't change the password: ${error.message}`;
}

/** Change password from the Security page (fully signed in). */
export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const { supabase } = await requireAdmin();
  const error = await updatePassword(supabase, formData);
  return error ? { error } : { done: true };
}

/** Set a new password after following the emailed reset link. */
export async function resetPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const { supabase, hasAuthenticator, twoStepPassed } = await getAdminSession();
  // With two-step on, the reset link alone isn't enough: the code is needed too.
  if (hasAuthenticator && !twoStepPassed) redirect("/admin/two-step?next=/admin/reset-password");

  const error = await updatePassword(supabase, formData);
  if (error) return { error };
  redirect("/admin?password=changed");
}

export type ForgotState = { sent?: boolean; error?: string; email?: string };

/** Emails a reset link. Always answers the same way, so it can't reveal which emails are admins. */
export async function requestPasswordReset(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Enter your email address.", email };

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");

  // Supabase only honours redirect URLs on its allow list, so a forged Host
  // header can't point the email somewhere else.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${proto}://${host}/admin/auth/confirm`,
  });
  if (error) console.error("[admin] Password reset email failed:", error.code, error.message);

  return { sent: true, email };
}
