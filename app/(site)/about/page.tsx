import type { Metadata, Viewport } from "next";
import LandingPage from "@/components/home/LandingPage";

// Same content as the home page, opened at the About Us section.
export const metadata: Metadata = {
  title: "About Us",
  description: "About MYNIX (PVT) LTD — professional gemology tools and equipment from Beruwala, Sri Lanka.",
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function AboutUsPage() {
  return <LandingPage section="about" />;
}
