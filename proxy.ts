import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Admin gate: refreshes the Supabase session cookie and sends signed-out
 * visitors to the login page. This is an optimistic check only — every admin
 * page and action re-verifies the user, and database rules (RLS) enforce it.
 */
/** Admin pages reachable while signed out (the password-reset flow). */
const PUBLIC_PATHS = new Set(["/admin/forgot-password", "/admin/auth/confirm"]);

export async function proxy(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === "/admin/login";
  if (!isSupabaseConfigured) {
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (PUBLIC_PATHS.has(request.nextUrl.pathname)) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  if (!signedIn && !isLogin) return NextResponse.redirect(new URL("/admin/login", request.url));
  // Signed in but not an admin: the login page shows why (with sign-out), so let it through.
  const showingError = request.nextUrl.searchParams.has("error");
  if (signedIn && isLogin && !showingError) return NextResponse.redirect(new URL("/admin", request.url));
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
