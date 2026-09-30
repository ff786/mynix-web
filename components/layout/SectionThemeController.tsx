"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isLandingPath } from "@/components/layout/navigation";

/**
 * Drives the page background and fixed-chrome themes below the hero.
 *
 * Sections opt in with `data-section-bg="#hex"` plus `data-theme="light|dark"`.
 * As the boundary into the next section travels from 65% → 40% of the viewport
 * height, the page background (`--page-bg`) blends into that section's colour,
 * so sections flow into each other instead of meeting at hard edges.
 *
 * Everything themed follows that live colour: each section's `data-theme` (so
 * the tail of the previous section stays readable once the background has
 * turned), plus the navbar and WhatsApp badge. At rest the background equals the
 * section's own colour, so each section shows its designed theme.
 *
 * While no themed section is on screen (i.e. inside the hero), MynixTorchViewer
 * owns these values instead.
 */

const BLEND_FROM = 0.65;
const BLEND_TO = 0.4;

type RGB = [number, number, number];

const parseHex = (hex: string): RGB => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function SectionThemeController() {
  // /about, /contact etc. are the landing page too: moving between them only
  // swaps the address (see scrollToSectionOnHome), so don't reset the theme.
  const pathname = usePathname();
  const page = isLandingPath(pathname) ? "/" : pathname;

  useEffect(() => {
    const root = document.documentElement;
    let frame: number | null = null;

    const update = () => {
      frame = null;
      const sections = [...document.querySelectorAll<HTMLElement>("[data-section-bg]")];
      if (sections.length === 0) return;

      const vh = window.innerHeight;
      const rects = sections.map((s) => s.getBoundingClientRect());
      // Still inside the hero: leave the page to MynixTorchViewer.
      if (rects[0].top >= vh) return;

      let color = parseHex(sections[0].dataset.sectionBg!);
      for (let i = 1; i < sections.length; i++) {
        const t = clamp01((vh * BLEND_FROM - rects[i].top) / (vh * (BLEND_FROM - BLEND_TO)));
        if (t === 0) break;
        color = mix(color, parseHex(sections[i].dataset.sectionBg!), t);
      }
      root.style.setProperty("--page-bg", `rgb(${color.map(Math.round).join(", ")})`);

      const luminance = (0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]) / 255;
      const theme = luminance > 0.5 ? "light" : "dark";
      for (const section of sections) {
        if (section.dataset.theme !== theme) section.dataset.theme = theme;
      }
      if (root.dataset.navTheme !== theme) root.dataset.navTheme = theme;
      if (root.dataset.badgeTheme !== theme) root.dataset.badgeTheme = theme;
    };

    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== null) cancelAnimationFrame(frame);
      delete root.dataset.navTheme;
      delete root.dataset.badgeTheme;
    };
  }, [page]);

  return null;
}
