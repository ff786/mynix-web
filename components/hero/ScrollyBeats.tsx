"use client";

import { createContext, Fragment, useContext, type ReactNode } from "react";
import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { EASE_OUT, WordMask } from "@/components/ui/text/RevealText";
import type { ProductRef } from "@/types/product";
import { cn } from "@/utils/cn";
import { flagshipHref } from "@/utils/links";

// All timings are fractions of total hero scroll.
const FADE = 0.05; // beat container fade
const CHAR_SPREAD = 0.03; // first → last letter offset
const CHAR_DURATION = 0.025; // each letter's rise
const STEP = 0.012; // offset between secondary elements (eyebrow, body, CTA)

type ScrollyBeatsProps = {
  /** Smoothed scroll progress of the hero (0 → 1). */
  progress: MotionValue<number>;
  headingColor: MotionValue<string>;
  bodyColor: MotionValue<string>;
  /** True once the loader has cleared — plays Beat A's intro. */
  ready: boolean;
  /** Product behind Beat D's "Order the kit". */
  flagship: ProductRef;
};

/** Text overlays for Beats A–D, positioned where the footage leaves empty space. */
export default function ScrollyBeats({ progress, headingColor, bodyColor, ready, flagship }: ScrollyBeatsProps) {
  const indicatorOpacity = useTransform(progress, [0, 0.1], [1, 0]);
  const shared = { progress, ready };

  return (
    <>
      {/* Beat A — hero */}
      <Beat {...shared} range={[0, 0.2]} holdStart className="top-[13vh]">
        {/* The MYNIX motto. The torch is contain-fit, so it scales with the smaller of
            width and height; sizing the headline the same way keeps it clear of the torch. */}
        <Stagger order={0}>
          <Eyebrow color={bodyColor}>Gemological Tools &amp; Equipment</Eyebrow>
        </Stagger>
        <Heading
          as="h1"
          color={headingColor}
          lines={["Unleash your", "passion with", "precision"]}
          size="text-[length:clamp(2.5rem,min(4.2vw,7.4vh),6rem)]"
        />
      </Beat>

      {/* Beat B */}
      <Beat {...shared} range={[0.25, 0.45]} className="bottom-[9vh]">
        <Stagger order={0}>
          <Eyebrow color={bodyColor}>The Engineering</Eyebrow>
        </Stagger>
        <Heading color={headingColor} lines={["Surface & Measure"]} />
        <Stagger order={1}>
          <Body color={bodyColor}>
            Anodized aluminum chassis featuring laser-etched precision ruler markings and a brushed
            stainless steel 5mm interchangeable nozzle.
          </Body>
        </Stagger>
      </Beat>

      {/* Beat C */}
      <Beat {...shared} range={[0.5, 0.7]} className="top-[13vh]">
        <Stagger order={0}>
          <Eyebrow color={bodyColor}>Optical Performance</Eyebrow>
        </Stagger>
        <Heading color={headingColor} lines={["Pure Optical", "Power"]} />
        <Stagger order={1}>
          <Body color={bodyColor}>
            High-output UV LED emitter module paired with a precision glass focusing lens and micro-PCB
            driver circuit board.
          </Body>
        </Stagger>
      </Beat>

      {/* Beat D — CTA */}
      <Beat {...shared} range={[0.76, 1]} holdEnd className="top-[11vh]">
        <Heading color={headingColor} lines={["Mynix", "Gemology"]} />
        <Stagger order={1}>
          <Body color={bodyColor} className="max-w-xs">
            Engineered for uncompromising accuracy. Order the professional appraisal kit now.
          </Body>
        </Stagger>
        <Stagger order={2}>
          <CtaButton progress={progress} start={0.76} flagship={flagship} />
        </Stagger>
      </Beat>

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 1, delay: 1.4 }}
      >
        <ScrollIndicator opacity={indicatorOpacity} />
      </motion.div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Beat timing context                                                        */
/* -------------------------------------------------------------------------- */

type BeatTiming = {
  progress: MotionValue<number>;
  ready: boolean;
  start: number;
  end: number;
  /** Visible at scroll 0 — enters with a time-based intro instead of on scroll. */
  holdStart: boolean;
  /** Never exits (final beat). */
  holdEnd: boolean;
};

const BeatContext = createContext<BeatTiming | null>(null);

function useBeat() {
  const beat = useContext(BeatContext);
  if (!beat) throw new Error("Beat children must be rendered inside <Beat>");
  return beat;
}

type BeatProps = {
  progress: MotionValue<number>;
  ready: boolean;
  range: [number, number];
  holdStart?: boolean;
  holdEnd?: boolean;
  className?: string;
  children: ReactNode;
};

function Beat({ progress, ready, range: [start, end], holdStart = false, holdEnd = false, className, children }: BeatProps) {
  const input = [start, start + FADE, end - FADE, end];
  const opacity = useTransform(progress, input, [holdStart ? 1 : 0, 1, 1, holdEnd ? 1 : 0]);
  const y = useTransform(progress, input, [holdStart ? 0 : 20, 0, 0, holdEnd ? 0 : -20]);

  return (
    <BeatContext.Provider value={{ progress, ready, start, end, holdStart, holdEnd }}>
      <motion.section
        style={{ opacity, y }}
        className={cn(
          "pointer-events-none absolute left-0 z-10 flex max-w-6xl flex-col gap-5 px-6 will-change-transform sm:left-[5vw]",
          className,
        )}
      >
        {children}
      </motion.section>
    </BeatContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Letter-by-letter heading                                                   */
/* -------------------------------------------------------------------------- */

function Heading({
  as = "h2",
  color,
  lines,
  size = "text-5xl sm:text-7xl xl:text-8xl 2xl:text-9xl",
}: {
  as?: "h1" | "h2";
  color: MotionValue<string>;
  lines: string[];
  /** Font-size classes; replaces the default display scale entirely. */
  size?: string;
}) {
  const Tag = as === "h1" ? motion.h1 : motion.h2;
  const count = lines.join("").replace(/\s/g, "").length;
  let index = 0;

  return (
    <Tag
      aria-label={lines.join(" ")}
      style={{ color }}
      className={`${size} font-semibold uppercase leading-[0.88] tracking-tighter`}
    >
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.split(" ").map((word, wi) => (
            <Fragment key={wi}>
              {wi > 0 && " "}
              <WordMask>
                {[...word].map((char) => {
                  const i = index++;
                  return <Char key={i} char={char} index={i} count={count} />;
                })}
              </WordMask>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </Tag>
  );
}

/** One letter: rises into place as its beat arrives, lifts away as it leaves. */
function Char({ char, index, count }: { char: string; index: number; count: number }) {
  const { progress, ready, start, end, holdStart, holdEnd } = useBeat();
  const reduce = useReducedMotion();
  const t = count > 1 ? index / (count - 1) : 0;

  const input: number[] = [];
  const output: string[] = [];
  if (!holdStart) {
    const s = start + t * CHAR_SPREAD;
    input.push(s, s + CHAR_DURATION);
    output.push("110%", "0%");
  }
  if (!holdEnd) {
    const e = end - CHAR_SPREAD - CHAR_DURATION + t * CHAR_SPREAD;
    input.push(e, e + CHAR_DURATION);
    output.push("0%", "-110%");
  }
  const y = useTransform(progress, input, output);

  return (
    <motion.span className="inline-block will-change-transform" style={{ y }}>
      {holdStart ? (
        <motion.span
          className="inline-block"
          initial={reduce ? false : { y: "110%" }}
          animate={ready ? { y: "0%" } : undefined}
          transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.35 + index * 0.035 }}
        >
          {char}
        </motion.span>
      ) : (
        char
      )}
    </motion.span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Secondary copy                                                             */
/* -------------------------------------------------------------------------- */

/** Fades eyebrow / body / CTA in just after the heading, in `order`. */
function Stagger({ order, children }: { order: number; children: ReactNode }) {
  const { progress, ready, start, holdStart } = useBeat();
  const reduce = useReducedMotion();
  const input = [start + STEP + order * STEP, start + FADE + order * STEP];
  const opacity = useTransform(progress, input, [0, 1]);
  const y = useTransform(progress, input, [16, 0]);

  if (holdStart) {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={ready ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 1, ease: EASE_OUT, delay: 0.9 + order * 0.15 }}
      >
        {children}
      </motion.div>
    );
  }
  return <motion.div style={{ opacity, y }}>{children}</motion.div>;
}

function Body({
  color,
  className = "max-w-md",
  children,
}: {
  color: MotionValue<string>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.p style={{ color }} className={cn("text-base leading-relaxed tracking-tight sm:text-lg", className)}>
      {children}
    </motion.p>
  );
}

function Eyebrow({ color, children }: { color: MotionValue<string>; children: ReactNode }) {
  return (
    <motion.span
      style={{ color }}
      className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em]"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {children}
    </motion.span>
  );
}

function CtaButton({
  progress,
  start,
  flagship,
}: {
  progress: MotionValue<number>;
  start: number;
  flagship: ProductRef;
}) {
  // Only clickable once the beat is visible.
  const pointerEvents = useTransform(progress, (v) => (v > start + FADE / 2 ? "auto" : "none"));
  return (
    <motion.a
      href={flagshipHref(flagship)}
      style={{ pointerEvents }}
      className={buttonClasses({ size: "lg", className: "mt-4 w-fit" })}
    >
      Order the kit
      <ArrowRight aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </motion.a>
  );
}

function ScrollIndicator({ opacity }: { opacity: MotionValue<number> }) {
  return (
    <motion.div style={{ opacity }} className="flex flex-col items-center gap-3 text-slate-500">
      <span className="text-[10px] font-medium uppercase tracking-[0.35em]">Scroll to Explore</span>
      <span className="relative h-10 w-px overflow-hidden bg-slate-300">
        <motion.span
          className="absolute inset-x-0 top-0 h-1/2 bg-slate-900"
          animate={{ y: ["-100%", "200%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </span>
    </motion.div>
  );
}
