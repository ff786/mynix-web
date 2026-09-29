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

const SPRING = { stiffness: 100, damping: 30, restDelta: 0.001 };

const toCss = ([r, g, b]: RGB) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const luminance = ([r, g, b]: RGB) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/* -------------------------------------------------------------------------- */
/*  Frame preloading                                                           */
/* -------------------------------------------------------------------------- */

/** Average colour of the four corners — the studio backdrop of the frame. */
function sampleBackdrop(img: HTMLImageElement, ctx: CanvasRenderingContext2D): RGB {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
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

/**
 * Frame 0 first, then every 8th frame (so scrubbing looks right early), then the
 * rest. Only frame 0 gates the hero; the others stream in a few at a time so
 * decoding never floods the main thread.
 */
function loadOrder(count: number): number[] {
  const order = [0];
  for (let i = 8; i < count; i += 8) order.push(i);
  if (!order.includes(count - 1)) order.push(count - 1);
  for (let i = 1; i < count; i++) if (!order.includes(i)) order.push(i);
  return order;
}

const CONCURRENCY = 4;

function useFramePreloader(count: number, onFrame: () => void) {
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const backdropsRef = useRef<(RGB | null)[]>([]);
  const onFrameRef = useRef(onFrame);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    let cancelled = false;

    const sampler = document.createElement("canvas");
    sampler.width = 32;
    sampler.height = 18;
    const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });
    const backdrops: (RGB | null)[] = Array.from({ length: count }, () => null);
    backdropsRef.current = backdrops;

    const images = Array.from({ length: count }, () => {
      const img = new Image();
      img.decoding = "async";
      return img;
    });
    imagesRef.current = images;

    const queue = loadOrder(count);
    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = images[i];
        const done = () => {
          if (cancelled) return resolve();
          if (samplerCtx && img.naturalWidth > 0) backdrops[i] = sampleBackdrop(img, samplerCtx);
          if (i === 0) {
            setProgress(1);
            setReady(true);
          }
          onFrameRef.current();
          resolve();
        };
        // Decode up front so the first draw of each frame never janks.
        img.onload = () => {
          img.decode().catch(() => undefined).finally(done);
        };
        img.onerror = done;
        img.src = frameSrc(i);
      });

    const worker = async () => {
      while (!cancelled && queue.length > 0) await load(queue.shift()!);
    };
    // Frame 0 alone, then the rest in parallel lanes.
    load(queue.shift()!).then(() => {
      for (let lane = 0; lane < CONCURRENCY; lane++) void worker();
    });

    return () => {
      cancelled = true;
      queue.length = 0;
      for (const img of images) {
        img.onload = null;
        img.onerror = null;
        img.src = "";
      }
      imagesRef.current = [];
      sampler.width = 0;
      sampler.height = 0;
    };
  }, [count]);

  return { imagesRef, backdropsRef, progress, ready };
}

/** Backdrop of the nearest loaded frame (white until any have loaded). */
function nearestBackdrop(backdrops: (RGB | null)[], index: number): RGB {
  for (let offset = 0; offset < backdrops.length; offset++) {
    const found = backdrops[index - offset] ?? backdrops[index + offset];
    if (found) return found;
  }
  return WHITE;
}

const isDrawable = (img: HTMLImageElement | undefined): img is HTMLImageElement =>
  !!img && img.complete && img.naturalWidth > 0;

/* -------------------------------------------------------------------------- */
/*  Viewer                                                                     */
/* -------------------------------------------------------------------------- */

export default function MynixTorchViewer({ flagship }: { flagship: ProductRef }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const currentFrameRef = useRef(0);

  // Redraw as frames stream in, so a placeholder frame is swapped for the real one.
  const redrawRef = useRef<() => void>(() => undefined);
  const onFrame = useCallback(() => redrawRef.current(), []);
  const { imagesRef, backdropsRef, progress, ready } = useFramePreloader(FRAME_COUNT, onFrame);

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
    (index: number) => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      const images = imagesRef.current;
      if (!canvas || !ctx || images.length === 0) return;

      // Fall back to the nearest decoded frame if this one failed to load.
      let img: HTMLImageElement | undefined;
      for (let offset = 0; !img && offset < images.length; offset++) {
        if (isDrawable(images[index - offset])) img = images[index - offset];
        else if (isDrawable(images[index + offset])) img = images[index + offset];
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!img) return;

      // The canvas itself is already sized to the frame's aspect ratio.
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    },
    [imagesRef],
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
      const f = transform(p, SCROLL_KEYS, FRAME_KEYS);
      const index = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(f)));
      if (index !== currentFrameRef.current) {
        currentFrameRef.current = index;
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
      // (the spring may still be settling after a long jump).
      const container = containerRef.current;
      if (container && container.getBoundingClientRect().bottom < window.innerHeight - 1) return;

      const root = document.documentElement;
      root.style.setProperty("--page-bg", css);
      // Fixed chrome (navbar, WhatsApp badge) matches the page: light over white frames.
      const theme = luminance(bg) > 0.5 ? "light" : "dark";
      if (root.dataset.navTheme !== theme) root.dataset.navTheme = theme;
      if (root.dataset.badgeTheme !== theme) root.dataset.badgeTheme = theme;
    },
    [backdropsRef, backgroundColor, darkness, scheduleDraw],
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
  }, [draw]);

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
