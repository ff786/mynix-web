import type { Metadata, Viewport } from "next";
import LandingPage from "@/components/home/LandingPage";

// Same content as the home page, opened at the Products section.
export const metadata: Metadata = {
  title: "Products",
  description: "Browse MYNIX gemology tool categories — torches, loupes, polariscopes, refractometers, scales and more.",
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function ProductsPage() {
  return <LandingPage section="products" />;
}
