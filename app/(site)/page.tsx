import type { Metadata, Viewport } from "next";
import BrandStory from "@/components/about/BrandStory";
import MynixTorchViewer from "@/components/hero/MynixTorchViewer";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/text/Eyebrow";
import Reveal from "@/components/ui/text/Reveal";
import RevealText from "@/components/ui/text/RevealText";
import FlagshipSpecs from "@/components/showcase/FlagshipSpecs";
import NewsletterSection from "@/components/newsletter/NewsletterSection";
import ProductRanges from "@/components/showcase/ProductRanges";
import { ArrowRight } from "lucide-react";
import { getStorefront } from "@/lib/catalog";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { CONTACT_EMAIL, FACEBOOK_URL, INSTAGRAM_URL, WHATSAPP_NUMBER } from "@/utils/whatsapp";

// The hero opens on a white studio backdrop.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

/** Search engines' view of the business: contact details and social profiles (sameAs). */
const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "MYNIX (PVT) LTD",
  alternateName: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/apple-icon`,
  image: `${SITE_URL}/opengraph-image`,
  description: SITE_DESCRIPTION,
  email: CONTACT_EMAIL,
  telephone: `+${WHATSAPP_NUMBER}`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Ash-Sheikh-Fassy Mawatha, China Fort",
    addressLocality: "Beruwala",
    addressCountry: "LK",
  },
  sameAs: [INSTAGRAM_URL, FACEBOOK_URL],
};

export default async function Home() {
  const { products, categories } = await getStorefront();
  const flagship = products.find((p) => p.flagship);
  const flagshipRef = { id: flagship?.id ?? "", name: flagship?.name ?? "MYNIX Gemology Torch" };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_LD).replace(/</g, "\\u003c") }}
      />
      <MynixTorchViewer flagship={flagshipRef} />

      <FlagshipSpecs flagship={flagshipRef} />

      <section
        id="products"
        aria-labelledby="products-title"
        data-theme="light"
        data-section-bg="#f5f5f7"
        className="scroll-mt-[72px] px-6 py-24 sm:px-10 sm:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow className="mb-5">The Collection</Eyebrow>
              <RevealText
                id="products-title"
                text="Tools of the trade."
                className="text-4xl font-semibold uppercase leading-[0.92] tracking-tighter text-ink/90 sm:text-6xl lg:text-7xl"
              />
            </div>
            <Reveal as="p" delay={0.3} className="max-w-sm leading-relaxed text-ink/60">
              Everything the gem trade relies on from cutting and weighing to inspection, handling and
              presentation. Pick a category to shop its full range.
            </Reveal>
          </div>

          <ProductRanges categories={categories} />

          <Reveal className="mt-12 flex justify-center">
            <Button href="/catalog" variant="secondary" size="lg">
              Browse the full catalog
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Reveal>
        </div>
      </section>

      <BrandStory productCount={products.length} categoryCount={categories.length} />

      <NewsletterSection />
    </main>
  );
}
