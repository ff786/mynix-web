"use client";

import { motion } from "framer-motion";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { getWhatsAppGeneralUrl } from "@/utils/whatsapp";

export default function WhatsappBadge() {
  return (
    <motion.a
      href={getWhatsAppGeneralUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with MYNIX on WhatsApp"
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="badge-themed group fixed bottom-5 right-5 z-30 flex items-center rounded-full bg-ink p-3.5 text-canvas shadow-[0_4px_16px_rgba(0,0,0,0.16)] transition-colors duration-300 hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:bottom-8 sm:right-8"
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-[13px] font-medium tracking-tight transition-[max-width,padding] duration-500 group-hover:max-w-40 group-hover:px-2.5 sm:inline-block">
        Quick Inquiry
      </span>
    </motion.a>
  );
}
