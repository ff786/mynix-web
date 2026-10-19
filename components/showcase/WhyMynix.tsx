"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { LayoutGrid, MessageCircle, Ruler, ShieldCheck, ShoppingBag, type LucideIcon } from "lucide-react";
import SectionLink from "@/components/layout/SectionLink";
import Button, { buttonClasses } from "@/components/ui/Button";
import Eyebrow from "@/components/ui/text/Eyebrow";
import Reveal from "@/components/ui/text/Reveal";
import RevealText from "@/components/ui/text/RevealText";

type Strength = { icon: LucideIcon; label: string; value: string };

const STRENGTHS: Strength[] = [
  { icon: Ruler, label: "Precision", value: "Instruments chosen to show a stone's true colour, clarity and character" },
  { icon: LayoutGrid, label: "Full range", value: "Cutting, weighing, inspection, handling and presentation in one place" },
  { icon: ShieldCheck, label: "Built to last", value: "Durable tools made for daily use at the bench and in the field" },
  { icon: MessageCircle, label: "Direct support", value: "Talk to the MYNIX team on WhatsApp for pricing, availability and honest advice" },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

export default function WhyMynix() {
  return (
    <section
      id="specs"
      aria-labelledby="specs-title"
      data-theme="dark"
      data-section-bg="#050505"
      className="scroll-mt-[72px] px-6 py-24 sm:px-10 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow className="mb-5">Why MYNIX</Eyebrow>
            <RevealText
              id="specs-title"
              text={"Every instrument,\nchosen."}
              className="max-w-3xl text-4xl font-semibold uppercase leading-[0.92] tracking-tighter text-ink/90 sm:text-6xl lg:text-7xl"
            />
          </div>
          <Reveal as="p" delay={0.3} className="max-w-sm leading-relaxed text-ink/60">
            Gemology tools and equipment for the people who grade, trade and appraise stones, selected for
            precise, repeatable results at the bench and in the field.
          </Reveal>
        </div>

        {/* Transparent PNG of the MYNIX torch, one of the instruments in the range, sitting directly on the section. */}
        <motion.div {...reveal} className="relative mt-16 aspect-[1672/941]">
          <Image
            src="/images/the-flagship.png"
            alt="Exploded view of the MYNIX Gemology Torch, one of the instruments in the MYNIX range"
            fill
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="object-contain"
          />
        </motion.div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STRENGTHS.map((spec, i) => (
            <motion.div
              key={spec.label}
              {...reveal}
              transition={{ ...reveal.transition, delay: (i % 4) * 0.06 }}
              className="group rounded-2xl border border-ink/10 p-6 transition-colors duration-500 hover:bg-ink/[0.03] sm:p-8"
            >
              <spec.icon
                strokeWidth={1.5}
                className="h-6 w-6 text-ink/40 transition-colors duration-500 group-hover:text-accent"
              />
              <dt className="mt-6 text-[10px] font-medium uppercase tracking-[0.25em] text-ink/40">{spec.label}</dt>
              <dd className="mt-2 text-base font-medium leading-snug tracking-tight text-ink/85">{spec.value}</dd>
            </motion.div>
          ))}
        </dl>

        <motion.div {...reveal} className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Button href="/catalog" size="lg">
            <ShoppingBag className="h-5 w-5" />
            Shop the collection
          </Button>
          <SectionLink section="contact" className={buttonClasses({ variant: "secondary", size: "lg" })}>
            Ask For Support..
          </SectionLink>
        </motion.div>
      </div>
    </section>
  );
}
