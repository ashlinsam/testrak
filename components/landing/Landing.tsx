"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { site } from "@/data/site";
import { palettes } from "@/lib/identity";
import { useProgress } from "@/lib/progress";
import { Vinyl } from "@/components/ui/Vinyl";
import { TOTAL_RECORDS } from "@/data/records";

const landingLabel = {
  top: "24 Rotations  —  Side A  —  for you",
  bottom: "from your closest friends",
  centre: "24",
  palette: palettes[0],
  seed: 24,
};

export function Landing({
  onUnwrap,
  onOpenFinale,
}: {
  onUnwrap: (origin: { x: number; y: number }) => void;
  onOpenFinale: () => void;
}) {
  const progress = useProgress();
  const [leaving, setLeaving] = useState(false);
  const returning = progress.exploredCount > 0 || progress.opened.length > 0;

  const line = (i: number) => ({
    initial: { opacity: 0, y: 14, filter: "blur(10px)" },
    animate: leaving
      ? { opacity: 0, y: -18, filter: "blur(8px)", transition: { duration: 0.6, delay: i * 0.05 } }
      : { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.6, delay: 0.5 + i * 1.05, ease: [0.22, 1, 0.36, 1] as const } },
  });

  return (
    <motion.main
      className="relative isolate flex min-h-dvh items-center overflow-hidden bg-night"
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      {/* the lamp, just switched on */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 4, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(60% 50% at 22% 30%, rgba(217,160,74,.13), transparent 70%), radial-gradient(50% 60% at 90% 100%, rgba(110,36,48,.22), transparent 70%)",
        }}
      />

      {/* a record turning slowly at the edge of the frame */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -z-10"
        style={{
          width: "min(130vw, 62rem)",
          right: "max(-58vw, -30rem)",
          bottom: "max(-62vw, -32rem)",
        }}
        initial={{ opacity: 0, scale: 0.96, rotate: -8 }}
        animate={{ opacity: leaving ? 0.15 : 0.9, scale: 1, rotate: 0 }}
        transition={{ duration: 3.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="landing-spin">
          <Vinyl label={landingLabel} />
        </div>
      </motion.div>

      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 lg:px-16">
        <h1 className="font-display text-[clamp(2.9rem,11vw,7.4rem)] leading-[0.98] font-[340] text-paper">
          {site.openingLines.map((text, i) => (
            <motion.span key={text} className="block" style={{ textWrap: "balance" }} {...line(i)}>
              {text}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="font-display mt-8 max-w-md text-[clamp(1.15rem,3.6vw,1.45rem)] leading-snug text-mist italic"
          style={{ fontVariationSettings: '"opsz" 36, "SOFT" 100' }}
          {...line(3.3)}
        >
          {site.openingSubline}
        </motion.p>

        <motion.div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4" {...line(4.1)}>
          <button
            type="button"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setLeaving(true);
              onUnwrap({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
            }}
            className="group relative rounded-full border border-paper/45 px-7 py-3.5 text-[0.95rem] tracking-[0.04em] text-paper transition-colors duration-500 hover:border-amber hover:bg-amber/10 active:scale-[0.98]"
          >
            <span className="relative">{returning ? "Back to your records" : site.unwrapLabel}</span>
          </button>
          {returning && (
            <span className="font-spine text-sm tracking-wide text-mist/80">
              {progress.exploredCount} of {TOTAL_RECORDS} played
            </span>
          )}
          {progress.isUnlocked && (
            <button
              type="button"
              onClick={onOpenFinale}
              className="text-sm text-amber-soft underline decoration-amber/40 underline-offset-4 hover:decoration-amber"
            >
              Read the last note
            </button>
          )}
        </motion.div>
      </div>
    </motion.main>
  );
}
