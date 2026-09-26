"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { Menu } from "lucide-react";
import MobileNav from "@/components/layout/MobileNav";
import { NAV_ITEMS, navHref, sectionHref } from "@/components/layout/navigation";
import { buttonClasses } from "@/components/ui/Button";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { cn } from "@/utils/cn";
import { getWhatsAppGeneralUrl } from "@/utils/whatsapp";

export default function Navbar() {
  const onHome = usePathname() === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  // Transparent at the very top of the hero, glass after that. Light or dark
  // follows the section underneath (<html data-nav-theme>, set by the page).
  const transparent = onHome && !scrolled;

  return (
    <>
      <header
        className={cn(
          "nav-themed fixed inset-x-0 top-0 z-40 border-b text-ink transition-[background-color,border-color,color,backdrop-filter] duration-500",
          transparent ? "border-transparent bg-transparent" : "border-ink/5 bg-canvas/80 backdrop-blur-md",
        )}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-6 sm:px-10"
        >
          <Link
            href={sectionHref("top", onHome)}
            className="text-[15px] font-semibold uppercase tracking-[0.42em]"
          >
            Mynix
          </Link>

          <ul className="hidden items-center gap-9 lg:flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link
                  href={navHref(item, onHome)}
                  className="text-xs font-medium uppercase tracking-[0.22em] opacity-60 transition-opacity hover:opacity-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <a
              href={getWhatsAppGeneralUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ size: "sm", className: "hidden px-5 py-2.5 text-sm sm:inline-flex" })}
            >
              <WhatsAppIcon className="h-[18px] w-[18px]" />
              Quick Inquiry
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="-mr-2 rounded-full p-2 transition-opacity hover:opacity-70 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </nav>
      </header>

      <MobileNav open={menuOpen} onClose={closeMenu} onHome={onHome} />
    </>
  );
}
