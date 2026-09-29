import { CartProvider } from "@/components/cart/CartProvider";
import CookieConsent from "@/components/consent/CookieConsent";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import SectionThemeController from "@/components/layout/SectionThemeController";
import { getStorefront } from "@/lib/catalog";
import WhatsappBadge from "@/components/ui/WhatsappBadge";

/** Public site chrome (navbar, footer, cart). */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Categories for the Products menu (cached catalogue; empty if the POS is unreachable).
  const { categories, products } = await getStorefront();

  return (
    <CartProvider>
      <Navbar categories={categories} productCount={products.length} />
      {children}
      <Footer />
      <WhatsappBadge />
      <SectionThemeController />
      <CookieConsent />
    </CartProvider>
  );
}
