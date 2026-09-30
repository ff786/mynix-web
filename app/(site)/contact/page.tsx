import type { Metadata, Viewport } from "next";
import LandingPage from "@/components/home/LandingPage";

// Same content as the home page, opened at the Contact section.
export const metadata: Metadata = {
  title: "Contact",
  description: "Contact MYNIX on WhatsApp, email or visit the shop in Beruwala, Sri Lanka.",
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function ContactPage() {
  return <LandingPage section="contact" />;
}
