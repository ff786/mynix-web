import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Signed-in admin, whether or not they've passed two-step sign-in yet. Only
 * for the two-step and password pages — everything else uses requireAdmin().
 */
export async function getAdminSession() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) redirect("/admin/login");

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", claims.sub).maybeSingle();
  if (!admin) redirect("/admin/login?error=not-admin");

  // Always look the authenticator up: a session stays aal2 for a while after
  // its authenticator is removed, and that must not count as two-step.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const authenticatorId = factors?.totp[0]?.id ?? null;

  return {
    supabase,
    userId: claims.sub,
    email: claims.email ?? "",
    twoStepPassed: claims.aal === "aal2" && Boolean(authenticatorId),
    hasAuthenticator: Boolean(authenticatorId),
    authenticatorId,
  };
}

/**
 * Verifies the signed-in user is listed in `admins` and has passed two-step
 * sign-in (setting it up first if needed). Use at the top of every admin page
 * and server action — the proxy check alone is not authorization, and the
 * database rules require the same two-step session.
 */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.hasAuthenticator) redirect("/admin/two-step/setup");
  if (!session.twoStepPassed) redirect("/admin/two-step");
  return session;
}
