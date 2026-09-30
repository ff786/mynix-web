"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isLandingPath, scrollToSectionOnHome, sectionHref } from "@/components/layout/navigation";

/** A link to a landing-page section (e.g. /about) that glides there when already on the landing page. */
export default function SectionLink({
  section,
  className,
  children,
}: {
  section: string;
  className?: string;
  children: ReactNode;
}) {
  const onHome = isLandingPath(usePathname());
  return (
    <Link
      href={sectionHref(section)}
      onClick={(e) => scrollToSectionOnHome(e, section, onHome)}
      className={className}
    >
      {children}
    </Link>
  );
}
