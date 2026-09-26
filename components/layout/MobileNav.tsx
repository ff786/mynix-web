"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { NAV_ITEMS, navHref } from "@/components/layout/navigation";
import { buttonClasses } from "@/components/ui/Button";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { useModalBehaviour } from "@/utils/useModalBehaviour";
import { getWhatsAppGeneralUrl } from "@/utils/whatsapp";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  onHome: boolean;
};

export default function MobileNav({ open, onClose, onHome }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModalBehaviour(open, onClose, panelRef);

  // Close if the viewport grows past the breakpoint where the drawer is hidden.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && onClose();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open, onClose]);

  const links = NAV_ITEMS.map((item) => ({ key: item.key, label: item.label, href: navHref(item, onHome) }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-nav"
          className="fixed inset-0 z-[60] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            id="mobile-nav"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            tabIndex={-1}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-[#050505] px-6 pb-10 pt-5 text-white outline-none"
          >
            <div className="flex h-[52px] items-center justify-between">
              <span className="text-[15px] font-semibold uppercase tracking-[0.42em]">Mynix</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="-mr-2 rounded-full p-2 text-white/70 transition-colors hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav aria-label="Mobile" className="mt-12 flex-1">
              <ul className="space-y-1">
                {links.map((link, i) => (
                  <motion.li
                    key={link.key}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="block border-b border-white/5 py-4 text-2xl font-semibold tracking-tight text-white/80 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <a
              href={getWhatsAppGeneralUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ size: "lg", className: "w-full" })}
            >
              <WhatsAppIcon className="h-5 w-5" />
              Quick Inquiry
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
