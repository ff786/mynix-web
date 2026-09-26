"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/components/ui/text/RevealText";

type RevealProps = {
  as?: "div" | "p" | "span";
  delay?: number;
  /** Starting offset in px. */
  y?: number;
  className?: string;
  id?: string;
  children: ReactNode;
};

/** Soft fade-up for supporting copy and actions once they scroll into view. */
export default function Reveal({ as = "div", delay = 0, y = 18, className, id, children }: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = { div: motion.div, p: motion.p, span: motion.span }[as];

  return (
    <Tag
      id={id}
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1, ease: EASE_OUT, delay }}
    >
      {children}
    </Tag>
  );
}
