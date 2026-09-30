import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import SectionLink from "@/components/layout/SectionLink";
import CookieSettingsButton from "@/components/consent/CookieSettingsButton";
import { buttonClasses } from "@/components/ui/Button";
import NewsletterForm from "@/components/newsletter/NewsletterForm";
import FacebookIcon from "@/components/ui/FacebookIcon";
import InstagramIcon from "@/components/ui/InstagramIcon";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import Eyebrow from "@/components/ui/text/Eyebrow";
import Reveal from "@/components/ui/text/Reveal";
import RevealText from "@/components/ui/text/RevealText";
import {
  CONTACT_EMAIL,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  SHOP_ADDRESS,
  SHOP_MAP_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER,
  getDeveloperWhatsAppUrl,
  getWhatsAppGeneralUrl,
} from "@/utils/whatsapp";

/** `section` links glide to their landing-page section (clean URL, e.g. /about). */
const QUICK_LINKS: { label: string; href: string; section?: string }[] = [
  { label: "Torch Showcase", href: "/experience", section: "experience" },
  { label: "Flagship Specs", href: "/specs", section: "specs" },
  { label: "Products", href: "/products", section: "products" },
  { label: "About Us", href: "/about", section: "about" },
  { label: "Full Catalog", href: "/catalog" },
];

const SHOP_LINKS = [
  { label: "Shop the catalog", href: "/catalog" },
  { label: "Your cart", href: "/cart" },
  { label: "Your account", href: "/account" },
  { label: "Track an order", href: "/track" },
];

export default function Footer() {
  return (
    <footer
      id="contact"
      data-theme="dark"
      data-section-bg="#050505"
      className="scroll-mt-[72px] px-6 pb-10 pt-24 sm:px-10 sm:pt-32"
    >
      <div className="mx-auto max-w-7xl">
        {/* WhatsApp direct action box */}
        <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-ink/[0.02] p-8 sm:p-14">
          <div className="relative flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow className="mb-5">Direct Commerce</Eyebrow>
              <RevealText
                text="Talk to a specialist."
                className="max-w-2xl text-4xl font-semibold uppercase leading-[0.95] tracking-tighter text-ink/90 sm:text-6xl"
              />
              <Reveal as="p" delay={0.3} className="mt-5 max-w-md leading-relaxed text-ink/60">
                Pricing, availability and recommendations straight from the MYNIX team on WhatsApp.
              </Reveal>
            </div>
            <a
              href={getWhatsAppGeneralUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ size: "lg", className: "w-full md:w-auto" })}
            >
              <WhatsAppIcon className="h-5 w-5" />
              Chat on WhatsApp
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 py-20 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="MYNIX home" className="text-sm font-semibold uppercase tracking-[0.4em] text-ink/90 hover:text-ink">
              Mynix
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink/60">
              Gemology tools &amp; equipment for gemologists, traders and appraisers.
            </p>
            <p className="mb-3 mt-8 text-xs font-medium uppercase tracking-[0.25em] text-ink/40">Newsletter</p>
            <NewsletterForm size="compact" className="max-w-xs" />
          </div>

          <FooterColumn title="Quick Links">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                {link.section ? (
                  <SectionLink section={link.section} className="text-sm text-ink/60 transition-colors hover:text-ink">
                    {link.label}
                  </SectionLink>
                ) : (
                  <Link href={link.href} className="text-sm text-ink/60 transition-colors hover:text-ink">
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Shop">
            {SHOP_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-ink/60 transition-colors hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Contact">
            <li>
              <a
                href={getWhatsAppGeneralUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 text-sm text-ink/60 transition-colors hover:text-ink"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            </li>
            <li>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 text-sm text-ink/60 transition-colors hover:text-ink"
              >
                <InstagramIcon className="h-4 w-4" />
                Instagram
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            </li>
            <li>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 text-sm text-ink/60 transition-colors hover:text-ink"
              >
                <FacebookIcon className="h-4 w-4" />
                Facebook
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            </li>
            <li>
              <a
                href={`tel:+${WHATSAPP_NUMBER}`}
                className="inline-flex items-center gap-2.5 text-sm text-ink/60 transition-colors hover:text-ink"
              >
                <Phone className="h-4 w-4" />
                {WHATSAPP_DISPLAY}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2.5 text-sm text-ink/60 transition-colors hover:text-ink"
              >
                <Mail className="h-4 w-4" />
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <a
                href={SHOP_MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-2.5 text-sm leading-relaxed text-ink/60 transition-colors hover:text-ink"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {SHOP_ADDRESS}
              </a>
            </li>
          </FooterColumn>
        </div>

        <div className="flex flex-col gap-4 border-t border-ink/10 pb-16 pt-8 text-xs text-ink/40 sm:flex-row sm:items-center sm:justify-between sm:pb-0 sm:pr-20">
          <span>
            © {new Date().getFullYear()} MYNIX (PVT) LTD · Crafted &amp; developed by{" "}
            <a
              href={getDeveloperWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="FS Technologies — chat on WhatsApp (opens in a new tab)"
              className="group inline-flex items-center gap-0.5 rounded-sm text-ink/60 underline decoration-ink/0 underline-offset-4 transition-colors duration-300 hover:text-ink hover:decoration-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              FS Technologies
              <ArrowUpRight
                aria-hidden="true"
                className="h-3 w-3 -translate-x-0.5 translate-y-0.5 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100"
              />
            </a>
          </span>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/privacy" className="transition-colors hover:text-ink">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms &amp; Conditions
            </Link>
            <CookieSettingsButton className="transition-colors hover:text-ink" />
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title}>
      <h3 className="mb-5 text-xs font-medium uppercase tracking-[0.25em] text-ink/40">{title}</h3>
      <ul className="space-y-3">{children}</ul>
    </nav>
  );
}
