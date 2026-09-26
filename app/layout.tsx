import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

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
  title: {
    default: "MYNIX — Professional Gemology Tools & Equipment",
    template: "%s · MYNIX Gemology",
  },
  description:
    "Professional gemology tools and equipment — gem torches, loupes, polariscopes, refractometers, precision scales, lapidary supplies and appraisal accessories. Inquire directly on WhatsApp.",
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
