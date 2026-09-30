"use client";

import { useEffect } from "react";

/** Opens the landing page at a section (e.g. /about) instead of the top. */
export default function ScrollToSection({ id }: { id: string }) {
  useEffect(() => {
    // After the router's own scroll-to-top on navigation.
    const frame = requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({ behavior: "instant" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [id]);

  return null;
}
