import type { NextConfig } from "next";

/**
 * Baseline hardening for every page. The CSP only sets directives that can't
 * break the site's scripts or styles: no framing (clickjacking), no plugins,
 * forms/<base> limited to this origin, and any http:// request upgraded to https.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// Local card-payment testing opens the dev site through a Cloudflare quick tunnel
// (*.trycloudflare.com). Allowed in development only; production is unchanged.
const devTunnelHosts = process.env.NODE_ENV === "production" ? [] : ["*.trycloudflare.com"];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Lets a second dev server (e.g. a payment test run) use its own build folder; unset = ".next".
  distDir: process.env.NEXT_DIST_DIR || ".next",
  allowedDevOrigins: devTunnelHosts,
  experimental: { serverActions: { allowedOrigins: devTunnelHosts } },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // The home page lives at /; /home is an alias for it.
  async redirects() {
    return [{ source: "/home", destination: "/", permanent: true }];
  },
};

export default nextConfig;
