/**
 * Public site details used for metadata, sitemap and social cards.
 * SITE_URL must be the host that actually serves pages (mynix.lk 308-redirects
 * to www), otherwise every canonical and sitemap URL points Google at a redirect.
 */
export const SITE_URL = (process.env.SITE_URL ?? "https://www.mynix.lk").replace(/\/+$/, "");
/**
 * Online payments need a secure site address (OnePay only returns customers to https).
 * A plain-http localhost address is allowed too, for testing against a local stand-in for OnePay.
 */
export const SITE_URL_IS_SECURE = /^https:\/\/|^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(SITE_URL);
export const SITE_NAME = "MYNIX";
export const SITE_DESCRIPTION =
  "Professional gemology tools and equipment in Sri Lanka — gem torches, loupes, polariscopes, refractometers, precision scales, lapidary supplies and appraisal accessories. Cash on delivery island-wide.";
