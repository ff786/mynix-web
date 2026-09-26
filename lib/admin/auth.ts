import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Verifies the signed-in user is listed in `admins`. Use at the top of every
 * admin page and server action (the proxy check alone is not authorization).
 */
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/admin/login");

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!admin) redirect("/admin/login?error=not-admin");

  return { supabase, userId, email: (claimsData.claims.email as string | undefined) ?? "" };
}
