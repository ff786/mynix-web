import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Target of the password-reset email. The email template links here with a
 * one-time `token_hash`; exchanging it signs the admin in so they can choose a
 * new password. Works even if the link is opened on another device.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (tokenHash && type === "recovery") {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL("/admin/reset-password", request.url));
    console.error("[admin] Reset link rejected:", error.code, error.message);
  }

  return NextResponse.redirect(new URL("/admin/forgot-password?error=link", request.url));
}
