import Link from "next/link";
import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import NewsletterForm from "@/components/newsletter/NewsletterForm";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import Eyebrow from "@/components/ui/text/Eyebrow";
import Reveal from "@/components/ui/text/Reveal";
import RevealText from "@/components/ui/text/RevealText";
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER, getWhatsAppGeneralUrl } from "@/utils/whatsapp";

const QUICK_LINKS = [
  { label: "Torch Showcase", href: "/#experience" },
  { label: "Flagship Specs", href: "/#specs" },
  { label: "Products", href: "/#products" },
  { label: "About Us", href: "/#about" },
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
            <span className="text-sm font-semibold uppercase tracking-[0.4em] text-ink/90">
              Mynix
            </span>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink/60">
              Gemology tools &amp; equipment for gemologists, traders and appraisers.
            </p>
            <p className="mb-3 mt-8 text-xs font-medium uppercase tracking-[0.25em] text-ink/40">Newsletter</p>
            <NewsletterForm size="compact" className="max-w-xs" />
          </div>

          <FooterColumn title="Quick Links">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-ink/60 transition-colors hover:text-ink">
                  {link.label}
                </Link>
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
                href={`tel:+${WHATSAPP_NUMBER}`}
                className="inline-flex items-center gap-2.5 text-sm text-ink/60 transition-colors hover:text-ink"
              >
                <Phone className="h-4 w-4" />
                {WHATSAPP_DISPLAY}
              </a>
            </li>
            <li className="inline-flex items-center gap-2.5 text-sm text-ink/60">
              <MapPin className="h-6 w-6" />
               Ash-Sheikh-Fassy Mawatha, China Fort, Beruwala, Sri Lanka.
            </li>
          </FooterColumn>
        </div>

        <div className="flex flex-col gap-4 border-t border-ink/10 pt-8 text-xs text-ink/40 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} MYNIX Gemology. All rights reserved.</span>
          <span className="uppercase tracking-[0.2em]">Engineered for accuracy</span>
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
