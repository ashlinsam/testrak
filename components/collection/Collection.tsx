"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RecordEntry } from "@/data/types";
import { records, TOTAL_RECORDS } from "@/data/records";
import { pad2 } from "@/lib/identity";
import { useProgress } from "@/lib/progress";
import { Shelf, type ShelfHandle } from "./Shelf";
import { Tracklist } from "./Tracklist";

export function Collection({
  onSelect,
  onOpenFinale,
  focusRecordId,
}: {
  onSelect: (record: RecordEntry) => void;
  onOpenFinale: () => void;
  /** After closing the player, bring this sleeve back into view. */
  focusRecordId: string | null;
}) {
  const progress = useProgress();
  const shelf = useRef<ShelfHandle>(null);
  const [active, setActive] = useState(0);
  const [tracklistOpen, setTracklistOpen] = useState(false);
  const onActiveChange = useCallback((i: number) => setActive(i), []);

  // Land on the last record he was looking at.
  useEffect(() => {
    const target = focusRecordId ?? progress.lastRecordId;
    const i = records.findIndex((r) => r.id === target);
    if (i > 0) requestAnimationFrame(() => shelf.current?.scrollToIndex(i, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRecordId]);

  return (
    <motion.main
      className="room relative min-h-dvh overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.1 }}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 pt-[max(1.4rem,env(safe-area-inset-top))] sm:px-10 lg:px-16">
        <p className="font-display text-[1.05rem] tracking-[0.18em] text-paper/90" style={{ fontVariationSettings: '"opsz" 24, "SOFT" 100' }}>
          24 ROTATIONS
        </p>
        <div className="flex items-center gap-2 sm:gap-4">
          {progress.isUnlocked && (
            <button
              type="button"
              onClick={onOpenFinale}
              className="hidden rounded-full px-3 py-2 text-sm text-amber-soft hover:text-amber sm:block"
            >
              The last note
            </button>
          )}
          <button
            type="button"
            onClick={() => setTracklistOpen(true)}
            className="rounded-full px-3 py-2 text-sm text-mist transition-colors hover:text-paper"
          >
            Tracklist
          </button>
          <ProgressDial />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 sm:px-10 sm:pt-16 lg:px-16">
        <motion.h1
          className="font-display max-w-[17ch] text-[clamp(2.2rem,6.4vw,4.4rem)] leading-[1.02] font-[340] text-paper"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          Twenty-four records, chosen by your closest friends.
        </motion.h1>
        <motion.p
          className="mt-5 max-w-[46ch] text-[1.02rem] leading-relaxed text-mist"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        >
          Take one off the shelf. Inside each sleeve is a song and a note from the person who picked it for you.
        </motion.p>
      </section>

      <AnimatePresence>
        {progress.isUnlocked && !progress.finaleSeen && (
          <motion.div
            className="mx-auto mt-8 max-w-6xl px-6 sm:px-10 lg:px-16"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[3px] border border-amber/30 bg-amber/[0.07] px-5 py-4">
              <p className="font-display text-lg text-paper" style={{ fontVariationSettings: '"opsz" 24, "SOFT" 100' }}>
                You&rsquo;ve played all 24. Something else was left for you.
              </p>
              <button
                type="button"
                onClick={onOpenFinale}
                className="rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-night transition-colors hover:bg-amber-soft"
              >
                Open the last note
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 sm:mt-10">
        <Shelf
          ref={shelf}
          records={records}
          isExplored={progress.isExplored}
          exploredCount={progress.exploredCount}
          isUnlocked={progress.isUnlocked}
          onSelect={onSelect}
          onOpenFinale={onOpenFinale}
          onActiveChange={onActiveChange}
        />
      </div>

      <TickIndex active={active} isExplored={progress.isExplored} onJump={(i) => shelf.current?.scrollToIndex(i)} />

      <footer className="mx-auto max-w-6xl px-6 pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center sm:px-10 lg:px-16">
        <p className="text-[0.8rem] text-mist/60">Best with sound on.</p>
      </footer>

      <Tracklist
        open={tracklistOpen}
        onClose={() => setTracklistOpen(false)}
        isExplored={progress.isExplored}
        onSelect={(r) => {
          setTracklistOpen(false);
          onSelect(r);
        }}
      />
    </motion.main>
  );
}

/** 24 ticks: one per record. Amber once played. Tap to jump along the shelf. */
function TickIndex({ active, isExplored, onJump }: { active: number; isExplored: (id: string) => boolean; onJump: (i: number) => void }) {
  return (
    <nav aria-label="Jump to a record" className="mx-auto mt-2 max-w-6xl px-6 sm:px-10 lg:px-16">
      <ol className="flex items-end justify-center gap-[3px] sm:gap-[5px]">
        {records.map((r, i) => {
          const played = isExplored(r.id);
          const current = i === active;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-label={`Record ${r.recordNumber}, ${r.friendName}${played ? ", played" : ""}`}
                aria-current={current ? "true" : undefined}
                className="group flex h-9 w-[9px] items-end justify-center sm:w-3"
              >
                <span
                  className={`block w-[2px] rounded-full transition-all duration-500 ${played ? "bg-amber" : "bg-paper/25 group-hover:bg-paper/50"}`}
                  style={{ height: current ? 26 : i % 6 === 0 ? 16 : 11 }}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** A small turntable-counter: 24 segments around a ring. */
function ProgressDial() {
  const progress = useProgress();
  const size = 40;
  const c = size / 2;
  return (
    <div className="flex items-center gap-2.5" aria-label={`${progress.exploredCount} of ${TOTAL_RECORDS} records played`} role="img">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {records.map((r, i) => {
          const a = (i / records.length) * Math.PI * 2 - Math.PI / 2;
          const played = progress.isExplored(r.id);
          return (
            <line
              key={r.id}
              x1={c + Math.cos(a) * 12.5}
              y1={c + Math.sin(a) * 12.5}
              x2={c + Math.cos(a) * 18}
              y2={c + Math.sin(a) * 18}
              stroke={played ? "#d9a04a" : "rgba(239,230,212,.22)"}
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={c} cy={c} r="2" fill="rgba(239,230,212,.6)" />
      </svg>
      <span className="font-spine text-sm tabular-nums text-mist">
        {pad2(progress.exploredCount)}
        <span className="text-mist/50">/{TOTAL_RECORDS}</span>
      </span>
    </div>
  );
}
