"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/components/ui/text/RevealText";
import { cn } from "@/utils/cn";

/** Small uppercase section label: fades in while its letter-spacing settles. */
export default function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.p
      className={cn("text-xs font-medium uppercase text-accent", className)}
      initial={reduce ? false : { opacity: 0, letterSpacing: "0.6em" }}
      whileInView={{ opacity: 1, letterSpacing: "0.3em" }}
      style={reduce ? { letterSpacing: "0.3em" } : undefined}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1.2, ease: EASE_OUT }}
    >
      {children}
    </motion.p>
  );
}
