import type { Metadata, Viewport } from "next";
import LandingPage from "@/components/home/LandingPage";

// The hero opens on a white studio backdrop.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function Home() {
  return <LandingPage />;
}
