"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { EASE_OUT } from "@/components/ui/text/RevealText";

/** Counts from 0 to `value` the first time it scrolls into view. */
export default function CountUp({
  value,
  suffix = "",
  duration = 1.8,
}: {
  value: number;
  /** Static text after the number, e.g. "+". */
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const reduce = useReducedMotion();
  const count = useMotionValue(reduce ? value : 0);
  const display = useTransform(count, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(count, value, { duration, ease: EASE_OUT });
    return () => controls.stop();
  }, [inView, reduce, count, value, duration]);

  return (
    <span ref={ref}>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
      <motion.span aria-hidden>{display}</motion.span>
      {suffix && <span aria-hidden>{suffix}</span>}
    </span>
  );
}
