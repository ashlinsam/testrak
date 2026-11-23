"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { finale } from "@/data/finale";
import { records } from "@/data/records";
import { identityFor, seeded } from "@/lib/identity";
import { progressActions } from "@/lib/progress";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";

/**
 * The last note. All 24 records gather into one ring and turn once together;
 * then the words, then a letter signed by everyone.
 */
export function Finale({ onClose }: { onClose: () => void }) {
  const reduced = usePrefersReducedMotion();
  const letterRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const d = (s: number) => (reduced ? 0 : s);

  useEffect(() => {
    progressActions.markFinaleSeen();
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="The last note"
      className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto overscroll-contain bg-night"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      transition={{ duration: 1.2 }}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ background: "radial-gradient(50% 45% at 50% 45%, rgba(217,160,74,.12), transparent 70%)" }}
      />

      <div className="fixed top-0 right-0 z-10 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-6">
        <button ref={closeRef} type="button" onClick={onClose} className="rounded-full bg-night/75 px-4 py-2 text-sm text-mist ring-1 ring-paper/10 backdrop-blur-sm hover:text-paper">
          Back to the records
        </button>
      </div>

      {/* the ring */}
      <section className="relative grid min-h-dvh place-items-center px-6">
        <div className="finale-stage relative">
          <div className="finale-ring absolute inset-0">
            {records.map((r, i) => {
              const { palette } = identityFor(r);
              const angle = (i / records.length) * 360;
              return (
                <div key={r.id} className="absolute top-1/2 left-1/2" style={{ transform: `rotate(${angle}deg) translateY(calc(var(--R) * -1))` }}>
                  <motion.div
                    className="finale-disc vinyl"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: d(0.4 + i * 0.075), ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="absolute inset-[33%] rounded-full" style={{ background: palette.label }} />
                    <span className="absolute inset-[48%] rounded-full bg-night" />
                  </motion.div>
                </div>
              );
            })}
          </div>

          <div className="absolute inset-0 grid place-items-center text-center">
            <h2 className="font-display px-2 text-[clamp(1.45rem,5.2vw,2.6rem)] leading-[1.18] font-[340] text-paper">
              {finale.lines.map((line, i) => (
                <motion.span
                  key={line}
                  className={`block ${i === finale.lines.length - 1 ? "mt-3 text-[0.82em] text-mist italic" : ""}`}
                  initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 1.5, delay: d(2.6 + i * 1.3), ease: [0.22, 1, 0.36, 1] }}
                >
                  {line}
                </motion.span>
              ))}
            </h2>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={() => letterRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })}
          className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-full border border-paper/30 px-6 py-3 text-sm text-paper hover:border-amber"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: d(7) }}
        >
          Read the letter
        </motion.button>
      </section>

      {/* the letter */}
      <section ref={letterRef} className="relative px-4 pt-16 pb-[max(4rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-24">
        <article className="paper mx-auto max-w-2xl rounded-[2px] px-6 py-10 shadow-[0_40px_80px_-30px_rgba(0,0,0,.9)] sm:px-14 sm:py-16" style={{ rotate: "-0.4deg" }}>
          <p className="hand-a text-[length:calc(2.1rem*var(--hand,1))] leading-none text-burgundy">{finale.letterGreeting}</p>
          <div className="font-text mt-7 space-y-5 text-[1.08rem] leading-[1.75] text-ink">
            {finale.letter.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <p className="hand-a mt-8 text-[length:calc(1.7rem*var(--hand,1))] text-ink">{finale.letterSignOff}</p>

          <div className="mt-10 border-t border-ink/15 pt-8">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3" aria-label="Signed by">
              {records.map((r) => {
                const { hand } = identityFor(r);
                const tilt = (seeded(r.recordNumber + 90) - 0.5) * 9;
                return (
                  <li key={r.id} className={`${hand} text-[length:calc(1.5rem*var(--hand,1))] leading-none text-ink/85`} style={{ rotate: `${tilt}deg` }}>
                    {r.friendName}
                  </li>
                );
              })}
            </ul>
          </div>
        </article>

        <div className="mt-12 text-center">
          <button type="button" onClick={onClose} className="rounded-full border border-paper/30 px-6 py-3 text-sm text-paper hover:border-amber">
            Back to the records
          </button>
          <p className="mt-4 text-[0.8rem] text-mist/60">The last note stays here. Open it again from the shelf any time.</p>
        </div>
      </section>
    </motion.div>
  );
}
