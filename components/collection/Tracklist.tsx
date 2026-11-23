"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { RecordEntry } from "@/data/types";
import { records } from "@/data/records";
import { identityFor, pad2 } from "@/lib/identity";

/**
 * The back of the sleeve: every record, Side A and Side B.
 * Songs stay a surprise until they've been played.
 * Also the quickest, most accessible way to open any record.
 */
export function Tracklist({
  open,
  onClose,
  onSelect,
  isExplored,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (r: RecordEntry) => void;
  isExplored: (id: string) => boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose]);

  const sides = [records.slice(0, 12), records.slice(12)];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-night/70 backdrop-blur-[2px] sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tracklist-title"
            className="paper relative max-h-[88dvh] w-full max-w-3xl overflow-y-auto rounded-t-[6px] px-6 pt-7 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[3px] sm:px-12 sm:py-12"
            initial={{ y: 40, rotate: 0 }}
            animate={{ y: 0, rotate: -0.4 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 id="tracklist-title" className="font-display text-[2rem] leading-none text-ink sm:text-[2.6rem]">
                  24 Rotations
                </h2>
                <p className="mt-2 text-sm text-ink-soft">Every record on the shelf. Songs appear once you&rsquo;ve played them.</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="-mt-1 -mr-2 rounded-full px-3 py-2 text-sm text-ink-soft hover:text-ink"
              >
                Close
              </button>
            </div>

            <div className="mt-8 grid gap-10 sm:grid-cols-2 sm:gap-12">
              {sides.map((side, s) => (
                <section key={s} aria-label={s === 0 ? "Side A" : "Side B"}>
                  <h3 className="font-display border-b border-ink/15 pb-2 text-lg text-burgundy italic">
                    Side {s === 0 ? "A" : "B"}
                  </h3>
                  <ol>
                    {side.map((r) => {
                      const played = isExplored(r.id);
                      return (
                        <li key={r.id} className="border-b border-ink/10">
                          <button
                            type="button"
                            onClick={() => onSelect(r)}
                            className="grid w-full grid-cols-[2rem_1fr] items-baseline gap-x-2 py-2.5 text-left transition-colors hover:bg-ink/[0.04]"
                          >
                            <span className="font-spine text-xs font-semibold text-ink-soft tabular-nums">{pad2(r.recordNumber)}</span>
                            <span className="min-w-0">
                              <span className={`${identityFor(r).hand} block text-[length:calc(1.3rem*var(--hand,1))] leading-tight text-ink`}>{r.friendName}</span>
                              <span className="block truncate text-[0.82rem] text-ink-soft">
                                {played ? (
                                  <>
                                    {r.songTitle} <span className="text-ink-soft/70">by {r.artistName}</span>
                                  </>
                                ) : (
                                  <span className="italic opacity-70">Not played yet</span>
                                )}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
