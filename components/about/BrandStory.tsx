"use client";

import { motion, useReducedMotion } from "framer-motion";
import CountUp from "@/components/ui/text/CountUp";
import Eyebrow from "@/components/ui/text/Eyebrow";
import Reveal from "@/components/ui/text/Reveal";
import { EASE_OUT } from "@/components/ui/text/RevealText";
import ScrollFillText from "@/components/ui/text/ScrollFillText";
import FacebookIcon from "@/components/ui/FacebookIcon";
import InstagramIcon from "@/components/ui/InstagramIcon";
import { FACEBOOK_URL, INSTAGRAM_URL } from "@/utils/whatsapp";

const SOCIALS = [
  { label: "Instagram", href: INSTAGRAM_URL, Icon: InstagramIcon },
  { label: "Facebook", href: FACEBOOK_URL, Icon: FacebookIcon },
];

const PILLARS = [
  {
    title: "Precision First",
    body: "Every instrument we carry is chosen for one reason: it helps you see a stone as it truly is its colour, its clarity, its character.",
  },
  {
    title: "Rooted In The Trade",
    body: "Built around the everyday needs of gemologists, traders and appraisers in Sri Lanka from Rathnapura's gem markets to laboratories worldwide.",
  },
  {
    title: "Direct, Personal Service",
    body: "No carts, no call centres. Talk to the MYNIX team directly on WhatsApp for pricing, availability and honest recommendations.",
  },
];

const statsFor = (productCount: number, categoryCount: number) => [
  { value: productCount, suffix: "+", label: "Instruments & tools" },
  { value: categoryCount, suffix: "", label: "Product categories" },
];

const STORY =
  "The Gem trade runs on trust and trust begins with seeing clearly. MYNIX equips the people who grade, trade and appraise the world's gemstones with tools worthy of the stones they hold.";


/**
 * Split editorial layout on a 12-column grid: a sticky label column (4) and a
 * content column (8). Pillars and stats hang off the same content edge, and
 * every row is separated by a hairline that draws in on scroll.
 */
export default function BrandStory({ productCount, categoryCount }: { productCount: number; categoryCount: number }) {
  const stats = statsFor(productCount, categoryCount);
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      data-theme="light"
      data-section-bg="#f5f5f7"
      className="relative scroll-mt-[72px] overflow-clip px-6 py-28 sm:px-10 sm:py-40"
    >
      <div className="relative mx-auto max-w-7xl">
        {/* Story + pillars */}
        <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-10">
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-[calc(72px+3rem)]">
              <Eyebrow className="text-base font-semibold sm:text-lg">About MYNIX</Eyebrow>
              <Reveal as="p" delay={0.2} className="mt-5 max-w-[18rem] text-[15px] leading-relaxed text-ink/55">
                Gemology tools &amp; equipment for gemologists, traders and appraisers.
              </Reveal>
              <Reveal delay={0.3} className="mt-8 flex items-center gap-4">
                <span className="text-xs font-medium uppercase tracking-[0.25em] text-ink/50">Follow us</span>
                <span className="flex gap-2">
                  {SOCIALS.map(({ label, href, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`MYNIX on ${label}`}
                      className="rounded-full border border-ink/15 p-2.5 text-ink/70 transition-colors hover:border-accent hover:text-accent"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </span>
              </Reveal>
            </div>
          </aside>

          <div className="lg:col-span-8">
            <ScrollFillText
              id="about-title"
              text={STORY}
              className="text-base text-[2rem] font-semibold leading-[1.15] tracking-[-0.015em] text-ink sm:text-5xl lg:text-[3.5rem]"
            />

            <ol className="mt-24 sm:mt-32">
              {PILLARS.map((pillar, i) => (
                <li key={pillar.title} className="group/row relative">
                  <Hairline />
                  <Reveal delay={0.1} className="grid gap-3 py-10 sm:grid-cols-8 sm:gap-x-10 sm:py-12">
                    <span className="font-mono text-xs tabular-nums text-ink/40 transition-colors duration-500 group-hover/row:text-accent sm:col-span-1 sm:pt-2.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-base text-[1.75rem] font-normal leading-tight tracking-[-0.01em] text-ink sm:col-span-3">
                      {pillar.title}
                    </h3>
                    <p className="leading-relaxed text-ink/60 sm:col-span-4 sm:pt-1.5">{pillar.body}</p>
                  </Reveal>
                </li>
              ))}
              <li aria-hidden className="relative">
                <Hairline />
              </li>
            </ol>
          </div>
        </div>

        {/* Stats — same grid, numbers aligned to the content column */}
        <div className="relative mt-24 grid gap-y-10 pt-12 sm:mt-32 lg:grid-cols-12 lg:gap-x-10">
          <Hairline />
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-ink/50 lg:col-span-4 lg:pt-5">In numbers</p>
          <dl className="grid grid-cols-2 gap-x-10 lg:col-span-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="mt-3 text-xs uppercase tracking-[0.25em] text-ink/50">{stat.label}</dt>
                <dd className="text-base text-7xl font-light tabular-nums tracking-[-0.02em] text-ink sm:text-8xl">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/** 1px rule that draws in from the left when it scrolls into view. */
function Hairline() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className="absolute inset-x-0 top-0 h-px origin-left bg-ink/15"
      initial={reduce ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.4, ease: EASE_OUT }}
    />
  );
}
