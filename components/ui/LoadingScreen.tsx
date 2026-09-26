"use client";

import { motion } from "framer-motion";

/** Full-screen preloader shown while the hero image sequence loads. */
export default function LoadingScreen({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[linear-gradient(180deg,#ffffff_0%,#f1f5f9_55%,#050505_100%)]"
      role="status"
      aria-live="polite"
      aria-label={`Loading experience, ${pct}%`}
    >
      <motion.div
        className="mb-10 h-8 w-8 rounded-full border border-slate-900/10 border-t-slate-900"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <span className="mb-6 text-xs font-semibold uppercase tracking-[0.5em] text-slate-900">Mynix</span>
      <div className="h-px w-56 overflow-hidden bg-slate-900/10 sm:w-72">
        <motion.div
          className="h-full origin-left bg-slate-900"
          animate={{ scaleX: progress }}
          transition={{ ease: "easeOut", duration: 0.2 }}
        />
      </div>
      <span className="mt-4 font-mono text-[11px] tabular-nums tracking-widest text-slate-500">
        {String(pct).padStart(3, "0")}%
      </span>
    </motion.div>
  );
}
