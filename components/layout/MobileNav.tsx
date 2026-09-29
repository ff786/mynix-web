"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { NAV_ITEMS, navClick, navHref, scrollToSectionOnHome, sectionHref } from "@/components/layout/navigation";
import { buttonClasses } from "@/components/ui/Button";
import FacebookIcon from "@/components/ui/FacebookIcon";
import InstagramIcon from "@/components/ui/InstagramIcon";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import type { ProductCategory } from "@/types/product";
import { cn } from "@/utils/cn";
import { useModalBehaviour } from "@/utils/useModalBehaviour";
import { FACEBOOK_URL, INSTAGRAM_URL, getWhatsAppGeneralUrl } from "@/utils/whatsapp";

const SOCIALS = [
  { label: "Instagram", href: INSTAGRAM_URL, Icon: InstagramIcon },
  { label: "Facebook", href: FACEBOOK_URL, Icon: FacebookIcon },
];

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  onHome: boolean;
  categories: ProductCategory[];
};

export default function MobileNav({ open, onClose, onHome, categories }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [productsOpen, setProductsOpen] = useState(false);
  useModalBehaviour(open, onClose, panelRef);

  // Close if the viewport grows past the breakpoint where the drawer is hidden.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && onClose();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open, onClose]);

  const links = NAV_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    href: navHref(item, onHome),
    onClick: navClick(item, onHome),
  }));

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

            <nav aria-label="Mobile" className="-mx-6 mt-12 flex-1 overflow-y-auto px-6">
              <ul className="space-y-1">
                {links.map((link, i) => (
                  <motion.li
                    key={link.key}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {link.key === "products" && categories.length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setProductsOpen((value) => !value)}
                          aria-expanded={productsOpen}
                          aria-controls="mobile-products"
                          className="flex w-full items-center justify-between border-b border-white/5 py-4 text-2xl font-semibold tracking-tight text-white/80 transition-colors hover:text-white"
                        >
                          {link.label}
                          <ChevronDown
                            aria-hidden
                            className={cn("h-5 w-5 transition-transform duration-300", productsOpen && "rotate-180")}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {productsOpen && (
                            <motion.ul
                              id="mobile-products"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden border-b border-white/5"
                            >
                              {categories.map((category) => (
                                <li key={category.id}>
                                  <Link
                                    href={`/catalog?category=${category.id}#shop`}
                                    onClick={onClose}
                                    className="flex items-center justify-between py-2.5 pl-1 text-base text-white/65 transition-colors hover:text-white"
                                  >
                                    {category.name}
                                    <span className="text-xs tabular-nums text-white/35">{category.count}</span>
                                  </Link>
                                </li>
                              ))}
                              <li className="pb-3">
                                <Link
                                  href={sectionHref("products", onHome)}
                                  onClick={(e) => {
                                    onClose();
                                    scrollToSectionOnHome(e, "products", onHome);
                                  }}
                                  className="block py-2.5 pl-1 text-base font-medium text-white transition-colors hover:text-white/80"
                                >
                                  Browse all categories →
                                </Link>
                              </li>
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={(e) => {
                          onClose();
                          link.onClick?.(e);
                        }}
                        className="block border-b border-white/5 py-4 text-2xl font-semibold tracking-tight text-white/80 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </motion.li>
                ))}
              </ul>
            </nav>

            <div className="space-y-3">
              <Link href="/catalog" onClick={onClose} className={buttonClasses({ size: "lg", className: "w-full" })}>
                Shop now
              </Link>
              <a
                href={getWhatsAppGeneralUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-[15px] font-medium text-white/80 transition-colors hover:text-white"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Ask on WhatsApp
              </a>
              <div className="flex justify-center gap-3 pt-3">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`MYNIX on ${label}`}
                    className="rounded-full border border-white/15 p-3 text-white/70 transition-colors hover:border-white/40 hover:text-white"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
