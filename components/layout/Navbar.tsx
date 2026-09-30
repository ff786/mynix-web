"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight, ChevronDown, Menu } from "lucide-react";
import AccountButton from "@/components/cart/AccountButton";
import CartButton from "@/components/cart/CartButton";
import MobileNav from "@/components/layout/MobileNav";
import ProductsMenu from "@/components/layout/ProductsMenu";
import {
  NAV_ITEMS,
  isLandingPath,
  navClick,
  navHref,
  scrollToSectionOnHome,
  scrollToTopOnHome,
  sectionHref,
} from "@/components/layout/navigation";
import { buttonClasses } from "@/components/ui/Button";
import type { ProductCategory } from "@/types/product";
import { cn } from "@/utils/cn";

const PRODUCTS_MENU_ID = "products-menu";
const navLinkClass =
  "text-xs font-medium uppercase tracking-[0.22em] opacity-60 transition-opacity hover:opacity-100";

type NavbarProps = {
  /** POS categories for the Products menu (empty when the store is unavailable). */
  categories: ProductCategory[];
  productCount: number;
};

export default function Navbar({ categories, productCount }: NavbarProps) {
  const onHome = isLandingPath(usePathname());
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const [productsOpen, setProductsOpen] = useState(false);
  const closeProducts = useCallback(() => setProductsOpen(false), []);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasMenu = categories.length > 0;

  // Hover opens; leaving the header closes after a short grace period.
  const openOnHover = () => {
    clearTimeout(closeTimer.current);
    setProductsOpen(true);
  };
  const closeSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(closeProducts, 150);
  };

  // Escape (focus back to the trigger) and clicks outside close the menu.
  useEffect(() => {
    if (!productsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setProductsOpen(false);
      triggerRef.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setProductsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [productsOpen]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  // Transparent at the very top of the hero, glass after that. Light or dark
  // follows the section underneath (<html data-nav-theme>, set by the page).
  const transparent = onHome && !scrolled && !productsOpen;

  return (
    <>
      <header
        ref={headerRef}
        onPointerLeave={(e) => e.pointerType === "mouse" && closeSoon()}
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
            href="/"
            onClick={(e) => scrollToTopOnHome(e, onHome)}
            className="text-[15px] font-semibold uppercase tracking-[0.42em]"
          >
            Mynix
          </Link>

          <ul className="hidden items-center gap-9 lg:flex">
            {NAV_ITEMS.map((item) =>
              item.key === "products" && hasMenu ? (
                // Hover opens the category menu; clicking "Products" scrolls to the
                // Products section. The arrow opens the menu for keyboard and touch.
                <li
                  key={item.key}
                  onPointerEnter={(e) => e.pointerType === "mouse" && openOnHover()}
                  className="flex items-center gap-1"
                >
                  <Link
                    href={navHref(item)}
                    onClick={(e) => {
                      closeProducts();
                      navClick(item, onHome)?.(e);
                    }}
                    className={cn(navLinkClass, productsOpen && "opacity-100")}
                  >
                    {item.label}
                  </Link>
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setProductsOpen((open) => !open)}
                    aria-expanded={productsOpen}
                    aria-controls={PRODUCTS_MENU_ID}
                    aria-label="Product categories"
                    className={cn("-m-1 rounded-full p-1 opacity-60 transition-opacity hover:opacity-100", productsOpen && "opacity-100")}
                  >
                    <ChevronDown
                      aria-hidden
                      className={cn("h-3.5 w-3.5 transition-transform duration-300", productsOpen && "rotate-180")}
                    />
                  </button>
                </li>
              ) : (
                <li
                  key={item.key}
                  onPointerEnter={(e) => e.pointerType === "mouse" && closeSoon()}
                  className="flex items-center"
                >
                  <Link
                    href={navHref(item)}
                    onClick={navClick(item, onHome)}
                    className={navLinkClass}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>

          <div className="flex items-center gap-3">
            <Link
              href="/catalog"
              className={buttonClasses({ size: "sm", className: "hidden px-5 py-2.5 text-sm sm:inline-flex" })}
            >
              Shop now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <AccountButton />
            <CartButton />
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

        <AnimatePresence>
          {productsOpen && (
            <ProductsMenu
              id={PRODUCTS_MENU_ID}
              categories={categories}
              productCount={productCount}
              allCategoriesHref={sectionHref("products")}
              onNavigate={closeProducts}
              onAllCategories={(e) => scrollToSectionOnHome(e, "products", onHome)}
            />
          )}
        </AnimatePresence>
      </header>

      <MobileNav open={menuOpen} onClose={closeMenu} onHome={onHome} categories={categories} />
    </>
  );
}
