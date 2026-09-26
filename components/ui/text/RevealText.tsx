"use client";

import { Fragment } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/utils/cn";

export type TextPart = { text: string; className?: string };

type RevealTextProps = {
  as?: "h1" | "h2" | "h3" | "p";
  /** Plain string, or styled parts (e.g. a muted second sentence). "\n" forces a line break. */
  text: string | TextPart[];
  className?: string;
  id?: string;
  /** Seconds before the first word moves. */
  delay?: number;
  /** Seconds between words. */
  stagger?: number;
};

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const word: Variants = {
  hidden: { y: "110%" },
  shown: { y: "0%", transition: { duration: 1, ease: EASE_OUT } },
};

/**
 * Masked word-by-word reveal for large headings: each word rises from behind
 * its own clip line when the heading scrolls into view (once).
 */
export default function RevealText({ as = "h2", text, className, id, delay = 0, stagger = 0.06 }: RevealTextProps) {
  const reduce = useReducedMotion();
  const parts = typeof text === "string" ? [{ text }] : text;
  const label = parts.map((p) => p.text.replace(/\s*\n\s*/g, " ").trim()).join(" ");
  const Tag = { h1: motion.h1, h2: motion.h2, h3: motion.h3, p: motion.p }[as];

  return (
    <Tag
      id={id}
      aria-label={label}
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {parts.map((part, pi) => (
        <Fragment key={pi}>
          {pi > 0 && " "}
          {part.text.split("\n").map((line, li) => (
            <Fragment key={li}>
              {li > 0 && <br />}
              {line
                .split(" ")
                .filter(Boolean)
                .map((w, wi) => (
                  <Fragment key={wi}>
                    {wi > 0 && " "}
                    <WordMask className={part.className}>
                      <motion.span className="inline-block will-change-transform" variants={word}>
                        {w}
                      </motion.span>
                    </WordMask>
                  </Fragment>
                ))}
            </Fragment>
          ))}
        </Fragment>
      ))}
    </Tag>
  );
}

/**
 * Clips vertically only (so tight tracking never shaves letter edges); the
 * padding / negative margin pair keeps descenders inside the clip.
 */
export function WordMask({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className={cn("-my-[0.12em] inline-block py-[0.12em] align-top [clip-path:inset(0_-0.3em)]", className)}
    >
      {children}
    </span>
  );
}
