export const WHATSAPP_NUMBER = "94778843815";
export const WHATSAPP_DISPLAY = "+94 77 884 3815";

/** Shop contact details (footer, legal pages). */
export const CONTACT_EMAIL = "info@mynix.lk";
export const SHOP_ADDRESS = "Ash-Sheikh-Fassy Mawatha, China Fort, Beruwala, Sri Lanka";
export const SHOP_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("MYNIX, " + SHOP_ADDRESS)}`;

/** Social profiles (footer, mobile menu, About, search structured data). */
export const INSTAGRAM_URL = "https://www.instagram.com/__mynix__/";
export const FACEBOOK_URL = "https://www.facebook.com/p/Mynix-61558258497059/";

export function getWhatsAppInquiryUrl(productName: string): string {
  const message = `Hello MYNIX Team, I have a question about ${productName}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** General inquiry, not tied to a product (navbar, footer, floating badge). */
export function getWhatsAppGeneralUrl(
  message = "Hello MYNIX Team, I would like to know more about your gemology tools and equipment.",
): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Site developer credit in the footer — a separate line from the shop's. */
export const DEVELOPER_WHATSAPP_NUMBER = "94704494812";

export function getDeveloperWhatsAppUrl(
  message = "Hello FS Technologies, I came across your work on the MYNIX website and would like to discuss a project.",
): string {
  return `https://wa.me/${DEVELOPER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
