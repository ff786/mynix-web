import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Editorial serif for the About section's warmer, "heritage" voice. Normal
// proportions (not condensed); the optical-size axis gives large text a finer cut.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  axes: ["opsz"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MYNIX — Professional Gemology Tools & Equipment in Sri Lanka",
    template: "%s · MYNIX Gemology",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "MYNIX",
    "Mynix Sri Lanka",
    "gemology tools",
    "gemology equipment Sri Lanka",
    "gem torch",
    "gem loupe",
    "polariscope",
    "refractometer",
    "gem scale",
    "lapidary supplies",
    "Beruwala",
  ],
  category: "shopping",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  // Search Console's HTML-tag verification, if the domain isn't verified by DNS.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_LK",
    url: "/",
    title: "MYNIX — Professional Gemology Tools & Equipment in Sri Lanka",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "MYNIX — Professional Gemology Tools & Equipment in Sri Lanka",
    description: SITE_DESCRIPTION,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${newsreader.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
