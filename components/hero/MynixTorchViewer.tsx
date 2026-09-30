"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  transform,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import ScrollyBeats from "@/components/hero/ScrollyBeats";
import LoadingScreen from "@/components/ui/LoadingScreen";
import type { ProductRef } from "@/types/product";

/* -------------------------------------------------------------------------- */
/*  Config                                                                     */
/* -------------------------------------------------------------------------- */

const FRAME_COUNT = 174;
const frameSrc = (index: number) =>
  `/images/mynix-landing-images/ezgif-frame-${String(index + 1).padStart(3, "0")}.jpg`;
const FRAME_ASPECT = 1920 / 1080;

// Scroll → frame timeline. The footage stays on a white studio backdrop until
// ~frame 147, plunges into the dark void by frame 168, then holds on the
// labelled engineering view. The plunge is timed to land between Beat C and D.
// A monotone cubic runs through these keys, so the playback speed changes
// smoothly (no sudden stop after the plunge) while still hitting every key.
const SCROLL_KEYS = [0, 0.68, 0.76, 0.9, 1];
const FRAME_KEYS = [0, 147, 168, FRAME_COUNT - 1, FRAME_COUNT - 1];

type RGB = [number, number, number];
const WHITE: RGB = [255, 255, 255];
const VOID: RGB = [5, 5, 5]; // #050505 — footer colour
// The last stretch eases the frame's own dark backdrop into the footer's #050505.
const VOID_BLEND: [number, number] = [0.9, 1];

// Text colours follow how dark the page actually is (0 = white, 1 = void).
const INK_STOPS = [0, 0.35, 0.65, 1];
const HEADING_COLORS = ["#0f172a", "#0f172a", "rgba(255,255,255,0.9)", "rgba(255,255,255,0.9)"];
const BODY_COLORS = ["#475569", "#475569", "rgba(255,255,255,0.6)", "rgba(255,255,255,0.6)"];

// Critically damped: follows the scroll closely and settles without a slow tail.
const SPRING = { stiffness: 240, damping: 32, mass: 1, restDelta: 0.0005 };

const toCss = ([r, g, b]: RGB) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const luminance = ([r, g, b]: RGB) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/** Fritsch–Carlson monotone cubic through (xs, ys): smooth, never overshoots. */
function monotoneCubic(xs: number[], ys: number[]): (x: number) => number {
  const n = xs.length;
  const d = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x));
  const m = xs.map((_, i) =>
    i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2,
  );
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
}

const frameAt = monotoneCubic(SCROLL_KEYS, FRAME_KEYS);

/* -------------------------------------------------------------------------- */
/*  Frame loading & decoding                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Frame 0 first, then every 8th frame (so scrubbing looks right early), then the
 * rest. Only frame 0 gates the hero; the others stream in a few at a time.
 */
function loadOrder(count: number): number[] {
  const order = [0];
  for (let i = 8; i < count; i += 8) order.push(i);
  if (!order.includes(count - 1)) order.push(count - 1);
  for (let i = 1; i < count; i++) if (!order.includes(i)) order.push(i);
  return order;
}

const FETCH_CONCURRENCY = 4;
// Decoded frames kept around the playhead. 174 full-HD frames (~1.4 GB decoded)
// overflow the browser's image cache, which then re-decodes JPEGs on the main
// thread mid-scroll — the "stuck" hitches. Instead a small window is decoded off
// the main thread (createImageBitmap) ahead of the scroll direction.
const DECODE_AHEAD = 10;
const DECODE_BEHIND = 4;
const KEEP_RADIUS = 14;
const MAX_IN_FLIGHT = 6;

/** Average colour of the four corners — the studio backdrop of the frame. */
function sampleBackdrop(bitmap: ImageBitmap, ctx: CanvasRenderingContext2D): RGB {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  const corners = [0, width - 1, (height - 1) * width, height * width - 1];
  const sum: RGB = [0, 0, 0];
  for (const p of corners) {
    sum[0] += data[p * 4];
    sum[1] += data[p * 4 + 1];
    sum[2] += data[p * 4 + 2];
  }
  return [sum[0] / 4, sum[1] / 4, sum[2] / 4];
}

/** Off-main-thread decode, resized to what the canvas actually shows. */
async function decode(blob: Blob, width?: number, height?: number): Promise<ImageBitmap> {
  if (!width || !height) return createImageBitmap(blob);
  try {
    return await createImageBitmap(blob, { resizeWidth: width, resizeHeight: height, resizeQuality: "high" });
  } catch {
    return createImageBitmap(blob); // Browsers without resize options.
  }
}

type FrameStore = {
  /** Decoded frame, or the nearest decoded one (or null before any are ready). */
  nearest: (index: number) => { index: number; bitmap: ImageBitmap } | null;
  get: (index: number) => ImageBitmap | undefined;
  /** Move the decode window to the playhead. */
  focus: (index: number) => void;
  /** Decode at this pixel size (the canvas backing store). */
  setSize: (width: number, height: number) => void;
};

function useFrames(count: number, onFrame: () => void) {
  const storeRef = useRef<FrameStore | null>(null);
  const backdropsRef = useRef<(RGB | null)[]>([]);
  const onFrameRef = useRef(onFrame);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const sampler = document.createElement("canvas");
    sampler.width = 32;
    sampler.height = 18;
    const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });
    const backdrops: (RGB | null)[] = Array.from({ length: count }, () => null);
    backdropsRef.current = backdrops;

    const blobs: (Blob | null)[] = Array.from({ length: count }, () => null);
    // Each frame remembers the decode size (generation) it was made at.
    const bitmaps = new Map<number, { bitmap: ImageBitmap; generation: number }>();
    const inFlight = new Set<number>();
    let center = 0;
    let direction = 1;
    let size = null as { width: number; height: number } | null; // set by setSize()
    let generation = 0; // bumps when the decode size changes

    const wanted = (i: number) => Math.abs(i - center) <= KEEP_RADIUS;

    const request = (i: number) => {
      const blob = blobs[i];
      if (!blob || bitmaps.get(i)?.generation === generation || inFlight.has(i)) return;
      inFlight.add(i);
      const gen = generation;
      decode(blob, size?.width, size?.height)
        .then((bitmap) => {
          inFlight.delete(i);
          if (cancelled || gen !== generation || !wanted(i)) return bitmap.close();
          // Swap in place: the previous (other-size) bitmap stays drawable until now.
          bitmaps.get(i)?.bitmap.close();
          bitmaps.set(i, { bitmap, generation: gen });
          onFrameRef.current();
          pump();
        })
        .catch(() => {
          inFlight.delete(i);
        });
    };

    /** Evict far frames, then decode the nearest missing ones, ahead first. */
    const pump = () => {
      if (cancelled) return;
      for (const [i, entry] of bitmaps) {
        if (!wanted(i)) {
          entry.bitmap.close();
          bitmaps.delete(i);
        }
      }
      const ahead = direction >= 0 ? DECODE_AHEAD : DECODE_BEHIND;
      const behind = direction >= 0 ? DECODE_BEHIND : DECODE_AHEAD;
      for (let step = 0; step <= Math.max(ahead, behind); step++) {
        if (inFlight.size >= MAX_IN_FLIGHT) return;
        const forward = center + step * (direction >= 0 ? 1 : -1);
        const backward = center - step * (direction >= 0 ? 1 : -1);
        if (step <= ahead && forward >= 0 && forward < count) request(forward);
        if (step > 0 && step <= behind && backward >= 0 && backward < count) request(backward);
      }
    };

    storeRef.current = {
      get: (i) => bitmaps.get(i)?.bitmap,
      nearest: (i) => {
        for (let offset = 0; offset <= KEEP_RADIUS; offset++) {
          const below = bitmaps.get(i - offset);
          if (below) return { index: i - offset, bitmap: below.bitmap };
          const above = bitmaps.get(i + offset);
          if (above) return { index: i + offset, bitmap: above.bitmap };
        }
        return null;
      },
      focus: (i) => {
        if (i === center) return;
        direction = i > center ? 1 : -1;
        center = i;
        pump();
      },
      setSize: (width, height) => {
        const previous = size;
        size = { width, height };
        // Re-decode only on a real change (not every pixel of a window drag);
        // current bitmaps keep drawing, scaled, until their replacements land.
        if (previous && Math.abs(width - previous.width) / previous.width < 0.2) return;
        generation++;
        pump();
      },
    };

    const queue = loadOrder(count);
    const load = async (i: number) => {
      try {
        const response = await fetch(frameSrc(i), {
          signal: controller.signal,
          priority: i === 0 ? "high" : "auto",
        } as RequestInit);
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        if (cancelled) return;
        blobs[i] = blob;
        if (samplerCtx) {
          const thumb = await decode(blob, sampler.width, sampler.height);
          if (!cancelled) backdrops[i] = sampleBackdrop(thumb, samplerCtx);
          thumb.close();
        }
        if (!cancelled && wanted(i)) request(i);
      } catch {
        // A missing frame falls back to its nearest neighbour when drawn.
      }
      if (!cancelled) onFrameRef.current();
    };

    const worker = async () => {
      while (!cancelled && queue.length > 0) await load(queue.shift()!);
    };
    // Frame 0 alone (decoded before the hero shows), then the rest in parallel lanes.
    const first = queue.shift()!;
    (async () => {
      try {
        const response = await fetch(frameSrc(first), { signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        blobs[first] = blob;
        const bitmap = await decode(blob, size?.width, size?.height);
        if (cancelled) return bitmap.close();
        bitmaps.set(first, { bitmap, generation });
        if (samplerCtx) backdrops[first] = sampleBackdrop(bitmap, samplerCtx);
      } catch {
        // Show the hero anyway; later frames fill in.
      }
      if (cancelled) return;
      setProgress(1);
      setReady(true);
      onFrameRef.current();
      for (let lane = 0; lane < FETCH_CONCURRENCY; lane++) void worker();
    })();

    return () => {
      cancelled = true;
      controller.abort();
      queue.length = 0;
      for (const { bitmap } of bitmaps.values()) bitmap.close();
      bitmaps.clear();
      storeRef.current = null;
      sampler.width = 0;
      sampler.height = 0;
    };
  }, [count]);

  return { storeRef, backdropsRef, progress, ready };
}

/** Backdrop of the nearest loaded frame (white until any have loaded). */
function nearestBackdrop(backdrops: (RGB | null)[], index: number): RGB {
  for (let offset = 0; offset < backdrops.length; offset++) {
    const found = backdrops[index - offset] ?? backdrops[index + offset];
    if (found) return found;
  }
  return WHITE;
}

/* -------------------------------------------------------------------------- */
/*  Viewer                                                                     */
/* -------------------------------------------------------------------------- */

export default function MynixTorchViewer({ flagship }: { flagship: ProductRef }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  // Fractional frame position — the canvas blends between neighbouring frames.
  const currentFrameRef = useRef(0);

  // Redraw as frames are decoded, so a placeholder frame is swapped for the real one.
  const redrawRef = useRef<() => void>(() => undefined);
  const onFrame = useCallback(() => redrawRef.current(), []);
  const { storeRef, backdropsRef, progress, ready } = useFrames(FRAME_COUNT, onFrame);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, SPRING);

  // Page background is taken from the frames themselves so the canvas edges
  // are invisible at every point of the light → dark transition.
  const backgroundColor = useMotionValue(toCss(WHITE));
  const darkness = useMotionValue(0);
  const headingColor = useTransform(darkness, INK_STOPS, HEADING_COLORS);
  const bodyColor = useTransform(darkness, INK_STOPS, BODY_COLORS);

  /* ----------------------------- Canvas drawing ---------------------------- */

  const draw = useCallback(
    (frame: number) => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      const store = storeRef.current;
      if (!canvas || !ctx || !store) return;

      const lo = Math.floor(frame);
      const t = frame - lo;
      // Nothing decoded near here yet: keep the last good frame on screen.
      const base = store.nearest(lo);
      if (!base) return;

      // Frames are opaque and the canvas matches their aspect, so no clear needed.
      ctx.globalAlpha = 1;
      ctx.drawImage(base.bitmap, 0, 0, canvas.width, canvas.height);

      // Cross-fade into the next frame so motion is continuous between frames.
      const next = base.index === lo && t > 0.01 ? store.get(lo + 1) : undefined;
      if (next) {
        ctx.globalAlpha = t;
        ctx.drawImage(next, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      }
    },
    [storeRef],
  );

  const scheduleDraw = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      draw(currentFrameRef.current);
    });
  }, [draw]);

  useEffect(() => {
    redrawRef.current = scheduleDraw;
  }, [scheduleDraw]);

  /** Sync frame, background and ink to a (smoothed) scroll progress. */
  const apply = useCallback(
    (p: number) => {
      const f = frameAt(p);
      // 1/32-frame steps: smooth blending without redrawing for invisible changes.
      const frame = Math.round(f * 32) / 32;
      if (frame !== currentFrameRef.current) {
        currentFrameRef.current = frame;
        storeRef.current?.focus(Math.round(f));
        scheduleDraw();
      }

      const backdrops = backdropsRef.current;
      let bg: RGB = WHITE;
      if (backdrops.length === FRAME_COUNT) {
        const lo = Math.floor(f);
        const hi = Math.min(FRAME_COUNT - 1, lo + 1);
        bg = mix(nearestBackdrop(backdrops, lo), nearestBackdrop(backdrops, hi), f - lo);
      }
      bg = mix(bg, VOID, transform(p, VOID_BLEND, [0, 1]));

      const css = toCss(bg);
      backgroundColor.set(css);
      darkness.set(1 - luminance(bg));

      // Once the hero has scrolled away, SectionThemeController owns the page
      // (the spring may still be settling after a long jump). Layout is only
      // read at the very end of the hero, never on ordinary scroll frames.
      const container = containerRef.current;
      if (
        container &&
        scrollYProgress.get() >= 1 &&
        container.getBoundingClientRect().bottom < window.innerHeight - 1
      )
        return;

      // --page-bg is on :root, so every write restyles the page — skip no-ops.
      const root = document.documentElement;
      if (root.style.getPropertyValue("--page-bg") !== css) root.style.setProperty("--page-bg", css);
      // Fixed chrome (navbar, WhatsApp badge) matches the page: light over white frames.
      const theme = luminance(bg) > 0.5 ? "light" : "dark";
      if (root.dataset.navTheme !== theme) root.dataset.navTheme = theme;
      if (root.dataset.badgeTheme !== theme) root.dataset.badgeTheme = theme;
    },
    [backdropsRef, backgroundColor, darkness, scheduleDraw, scrollYProgress, storeRef],
  );

  useMotionValueEvent(smooth, "change", apply);

  // Fit the canvas to the stage with "contain" logic (DPR-aware) so its feathered
  // edges sit exactly on the frame edges, then redraw.
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    ctxRef.current = ctx;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const stageBox = stage.getBoundingClientRect();
      const width = Math.min(stageBox.width, stageBox.height * FRAME_ASPECT);
      const height = width / FRAME_ASPECT;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      // Decode frames at the size they're shown (never above the 1920px source).
      const decodeWidth = Math.min(canvas.width, 1920);
      storeRef.current?.setSize(decodeWidth, Math.round(decodeWidth / FRAME_ASPECT));
      draw(currentFrameRef.current);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();

    return () => {
      observer.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Release the backing store.
      canvas.width = 0;
      canvas.height = 0;
      ctxRef.current = null;
    };
  }, [draw, storeRef]);

  // First paint once frame 0 is in (also covers restored scroll positions).
  useEffect(() => {
    if (!ready) return;
    currentFrameRef.current = -1;
    apply(smooth.get());
  }, [ready, apply, smooth]);

  // Lock scrolling until the first frame is in.
  useEffect(() => {
    if (ready) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [ready]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--page-bg", backgroundColor.get());
    root.dataset.navTheme = root.dataset.badgeTheme = darkness.get() > 0.5 ? "dark" : "light";
    return () => {
      root.style.removeProperty("--page-bg");
      delete root.dataset.navTheme;
      delete root.dataset.badgeTheme;
    };
  }, [backgroundColor, darkness]);

  /* --------------------------------- Render -------------------------------- */

  return (
    <>
      <AnimatePresence>{!ready && <LoadingScreen progress={progress} />}</AnimatePresence>

      <motion.section
        id="top"
        ref={containerRef}
        style={{ backgroundColor }}
        aria-label="MYNIX Gemology Torch showcase"
        className="relative h-[400vh]"
      >
        {/* Nav target for "Scrollytelling": one viewport in, where the deconstruction starts. */}
        <div id="experience" aria-hidden className="absolute inset-x-0 top-[100vh]" />

        <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
          {/* Canvas stage — edges are feathered so frame boundaries dissolve into the page. */}
          <div ref={stageRef} className="absolute inset-0 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              aria-label="MYNIX gemology torch deconstructing into its internal components"
              role="img"
              className="canvas-feather"
            />
          </div>

          <ScrollyBeats progress={smooth} headingColor={headingColor} bodyColor={bodyColor} ready={ready} flagship={flagship} />
        </div>
      </motion.section>
    </>
  );
}
