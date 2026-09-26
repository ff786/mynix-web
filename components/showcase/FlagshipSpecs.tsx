"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BatteryFull, Cpu, Focus, Power, Ruler, ShieldCheck, Target, Zap, type LucideIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import Eyebrow from "@/components/ui/text/Eyebrow";
import Reveal from "@/components/ui/text/Reveal";
import RevealText from "@/components/ui/text/RevealText";
import type { ProductRef } from "@/types/product";
import { getWhatsAppInquiryUrl } from "@/utils/whatsapp";

type Spec = { icon: LucideIcon; label: string; value: string };

const SPECS: Spec[] = [
  { icon: Zap, label: "Emitter", value: "High-output UV LED module" },
  { icon: Focus, label: "Optics", value: "Precision glass focusing lens" },
  { icon: Target, label: "Nozzle", value: "5mm brushed stainless steel cone, interchangeable" },
  { icon: ShieldCheck, label: "Chassis", value: "Anodized aluminum" },
  { icon: Ruler, label: "Measure", value: "Laser-etched precision ruler markings" },
  { icon: Cpu, label: "Driver", value: "Micro-PCB driver circuit board" },
  { icon: BatteryFull, label: "Power", value: "Rechargeable Li-ion battery cell" },
  { icon: Power, label: "Control", value: "Illuminated green power switch" },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

export default function FlagshipSpecs({ flagship }: { flagship: ProductRef }) {
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
            <Eyebrow className="mb-5">The Flagship</Eyebrow>
            <RevealText
              id="specs-title"
              text={"Every component,\nengineered."}
              className="max-w-3xl text-4xl font-semibold uppercase leading-[0.92] tracking-tighter text-ink/90 sm:text-6xl lg:text-7xl"
            />
          </div>
          <Reveal as="p" delay={0.3} className="max-w-sm leading-relaxed text-ink/60">
            The MYNIX Professional Gemology &amp; Jewelry Appraisal Torch built for precise, repeatable
            inspection at the bench and in the field.
          </Reveal>
        </div>

        {/* Transparent PNG — the torch sits directly on the section, no backdrop. */}
        <motion.div {...reveal} className="relative mt-16 aspect-[1672/941]">
          <Image
            src="/images/the-flagship.png"
            alt="Exploded view of the MYNIX torch showing nozzle, optics, LED module, battery and circuit board"
            fill
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="object-contain"
          />
        </motion.div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SPECS.map((spec, i) => (
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
          <Button href={getWhatsAppInquiryUrl(flagship.name, flagship.sku)} external size="lg">
            <WhatsAppIcon className="h-5 w-5" />
            Request a Quote
          </Button>
          <Button href="#experience" variant="secondary" size="lg">
            Replay the teardown
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
