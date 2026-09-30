import type { Metadata, Viewport } from "next";
import LandingPage from "@/components/home/LandingPage";

// Same content as the home page, opened at the Torch Showcase section.
export const metadata: Metadata = {
  title: "Torch Showcase",
  description: "See the MYNIX Gemology Torch up close — an interactive showcase of the flagship UV gem torch.",
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function TorchShowcasePage() {
  return <LandingPage section="experience" />;
}
