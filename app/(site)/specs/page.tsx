import type { Metadata, Viewport } from "next";
import LandingPage from "@/components/home/LandingPage";

// Same content as the home page, opened at the Flagship Specs section.
export const metadata: Metadata = {
  title: "Flagship Specs",
  description: "Specifications of the MYNIX Gemology Torch — emitter, optics, nozzle, chassis and battery.",
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function FlagshipSpecsPage() {
  return <LandingPage section="specs" />;
}
