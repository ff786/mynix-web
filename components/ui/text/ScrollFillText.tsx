"use client";

import { Fragment, useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";

type ScrollFillTextProps = {
  as?: "h2" | "p";
  text: string;
  className?: string;
  id?: string;
  /** Opacity of words that haven't been "read" yet. */
  dim?: number;
};

/**
 * Large text that fills in word by word as it scrolls through the viewport —
 * starts faint and reaches full ink by the time it's read.
 */
export default function ScrollFillText({ as = "h2", text, className, id, dim = 0.15 }: ScrollFillTextProps) {
  const ref = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  // Spring-wrapped: keeps the fill silky and stops Framer handing the opacity
  // to a native ScrollTimeline (which mis-handles target offsets).
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });
  const words = text.split(/\s+/).filter(Boolean);
  const Tag = as === "p" ? motion.p : motion.h2;

  return (
    <Tag ref={ref} id={id} aria-label={text} className={className}>
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          {reduce ? (
            <span aria-hidden>{word}</span>
          ) : (
            <FillWord progress={progress} range={[i / words.length, (i + 1) / words.length]} dim={dim}>
              {word}
            </FillWord>
          )}
        </Fragment>
      ))}
    </Tag>
  );
}

function FillWord({
  progress,
  range,
  dim,
  children,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  dim: number;
  children: string;
}) {
  const opacity = useTransform(progress, range, [dim, 1]);
  return (
    <motion.span aria-hidden style={{ opacity }}>
      {children}
    </motion.span>
  );
}
