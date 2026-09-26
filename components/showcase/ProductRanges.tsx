"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Diamond,
  Flashlight,
  Grab,
  LampDesk,
  LayoutGrid,
  Microscope,
  Ruler,
  Scale,
  ShoppingBag,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";
import { PRODUCT_RANGES } from "@/data/ranges";
import { getWhatsAppGeneralUrl } from "@/utils/whatsapp";

const ICONS: Record<string, LucideIcon> = {
  cutting: Diamond,
  scales: Scale,
  torches: Flashlight,
  inspection: Microscope,
  holding: Grab,
  magnifiers: ZoomIn,
  measuring: Ruler,
  boxes: LayoutGrid,
  packets: ShoppingBag,
  lamps: LampDesk,
};

const rangeInquiryUrl = (title: string) =>
  getWhatsAppGeneralUrl(
    `Hello MYNIX Team, I am interested in your ${title} range. Please share the available products, pricing and availability.`,
  );

/** Ten product ranges as a bordered tile grid; each tile opens a WhatsApp inquiry for that range. */
export default function ProductRanges() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {PRODUCT_RANGES.map((range, i) => {
        const Icon = ICONS[range.id];
        return (
          <motion.li
            key={range.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: (i % 5) * 0.05 }}
          >
            <a
              href={rangeInquiryUrl(range.title)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Inquire about ${range.title} on WhatsApp`}
              className="group flex h-full min-h-64 flex-col rounded-2xl border border-ink/10 bg-ink/[0.02] p-7 transition-[background-color,border-color,transform] duration-500 hover:-translate-y-0.5 hover:border-ink/20 hover:bg-ink/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent sm:p-8"
            >
              <div className="flex items-start justify-between">
                <Icon
                  strokeWidth={1.25}
                  className="h-7 w-7 text-ink/50 transition-colors duration-500 group-hover:text-ink"
                />
                <span className="font-mono text-[11px] tabular-nums text-ink/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="pt-12 text-xl font-semibold leading-tight tracking-tight text-ink/90">
                {range.title}
              </h3>
              <ul className="mt-3 space-y-1">
                {range.items.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-ink/50">
                    {item}
                  </li>
                ))}
              </ul>

              <span className="mt-auto inline-flex items-center pt-6 gap-1.5 text-[13px] font-medium text-ink/40 transition-colors duration-300 group-hover:text-ink">
                Inquire
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </a>
          </motion.li>
        );
      })}
    </ul>
  );
}
