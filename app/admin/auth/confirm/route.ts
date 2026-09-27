import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Target of the password-reset email. Handles both link styles:
 * - `token_hash` from the customised template — works on any device;
 * - `code` from Supabase's default template — works in the browser that asked
 *   for the reset (it holds the matching verifier cookie).
 * Either one signs the admin in so they can choose a new password.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const code = params.get("code");
  const supabase = await createSupabaseServerClient();

  let error: { code?: string; message: string } | null = null;
  if (tokenHash && params.get("type") === "recovery") {
    ({ error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else {
    error = { message: "No token in link" };
  }

  if (!error) return NextResponse.redirect(new URL("/admin/reset-password", request.url));
  console.error("[admin] Reset link rejected:", error.code, error.message);
  return NextResponse.redirect(new URL("/admin/forgot-password?error=link", request.url));
}
