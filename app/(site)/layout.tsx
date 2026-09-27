import { CartProvider } from "@/components/cart/CartProvider";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import SectionThemeController from "@/components/layout/SectionThemeController";
import WhatsappBadge from "@/components/ui/WhatsappBadge";

/** Public site chrome — kept out of /admin. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Navbar />
      {children}
      <Footer />
      <WhatsappBadge />
      <SectionThemeController />
    </CartProvider>
  );
}
