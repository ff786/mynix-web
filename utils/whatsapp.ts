export const WHATSAPP_NUMBER = "94778843815";
export const WHATSAPP_DISPLAY = "+94 77 884 3815";

export function getWhatsAppInquiryUrl(productName: string, sku: string): string {
  const message = `Hello MYNIX Team, I am interested in purchasing ${productName} (SKU: ${sku}). Please provide pricing and availability.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** General inquiry, not tied to a product (navbar, footer, floating badge). */
export function getWhatsAppGeneralUrl(
  message = "Hello MYNIX Team, I would like to know more about your gemology tools and equipment.",
): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
