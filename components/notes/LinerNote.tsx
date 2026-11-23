"use client";

import { AnimatePresence, motion } from "motion/react";
import type { RecordEntry } from "@/data/types";
import { identityFor } from "@/lib/identity";

/**
 * The note tucked inside the sleeve. Closed, a corner of paper peeks out;
 * once the record plays (or he chooses to read first) it slides out.
 */
export function LinerNote({ record, open, onOpen }: { record: RecordEntry; open: boolean; onOpen: () => void }) {
  const id = identityFor(record);
  const heading = id.noteHeading.startsWith("A little note from") ? `${id.noteHeading} ${record.friendName}` : id.noteHeading;
  const paragraphs = record.personalMessage.split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        {!open ? (
          <motion.div
            key="tucked"
            className="relative"
            exit={{ opacity: 0, y: -6, transition: { duration: 0.25 } }}
          >
            <div className="paper relative h-16 overflow-hidden rounded-t-[2px] opacity-90 shadow-[0_-2px_10px_rgba(0,0,0,.25)]" style={{ rotate: "-1.2deg" }}>
              <p className={`${id.hand} px-6 pt-4 text-[length:calc(1.5rem*var(--hand,1))] text-burgundy/80`}>{heading}</p>
            </div>
            <div className="relative -mt-3 rounded-[3px] bg-room-deep/95 px-5 py-4 ring-1 ring-paper/10">
              <p className="text-[0.92rem] leading-relaxed text-mist">
                {record.friendName} left a note in this sleeve. It slides out when the record starts playing.
              </p>
              <button
                type="button"
                onClick={onOpen}
                className="mt-2 text-[0.92rem] text-amber-soft underline decoration-amber/40 underline-offset-4 hover:decoration-amber"
              >
                Read it now
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.article
            key="open"
            aria-label={`Note from ${record.friendName}`}
            className="paper relative rounded-[2px] px-6 pt-7 pb-8 shadow-[0_2px_4px_rgba(0,0,0,.3),0_30px_50px_-24px_rgba(0,0,0,.8)] sm:px-9 sm:pt-9 sm:pb-10"
            initial={{ opacity: 0, y: -28, rotate: -3.5, clipPath: "inset(0 0 92% 0)" }}
            animate={{ opacity: 1, y: 0, rotate: -0.7, clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* a fold line across the insert */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[38%] h-8 -translate-y-1/2 bg-gradient-to-b from-transparent via-ink/[0.035] to-transparent" />

            <h3 className={`${id.hand} text-[length:calc(1.9rem*var(--hand,1))] leading-tight text-burgundy`}>{heading}</h3>
            {record.optionalMemoryTitle ? (
              <p className="font-display mt-1 text-[0.95rem] text-ink-soft italic" style={{ fontVariationSettings: '"opsz" 14, "SOFT" 100' }}>
                {record.optionalMemoryTitle}
              </p>
            ) : null}

            <div className="font-text mt-5 space-y-4 text-[1.06rem] leading-[1.72] text-ink">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {record.optionalPhoto?.src ? (
              <figure className="relative mx-auto mt-8 w-[94%] max-w-md bg-[#f8f4ec] p-2.5 pb-3 shadow-[0_3px_10px_rgba(0,0,0,.25)]" style={{ rotate: `${id.tilt * 2}deg` }}>
                <span aria-hidden className="tape absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-4deg]" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={record.optionalPhoto.src} alt={record.optionalPhoto.alt} className="block h-auto max-h-[70vh] w-full object-cover" loading="lazy" />
                {record.optionalPhoto.caption ? (
                  <figcaption className={`${id.hand} mt-2 text-center text-[length:calc(1.2rem*var(--hand,1))] text-ink-soft`}>{record.optionalPhoto.caption}</figcaption>
                ) : null}
              </figure>
            ) : null}

            <p className={`${id.hand} mt-7 text-right text-[length:calc(1.7rem*var(--hand,1))] text-ink`}>{record.optionalSignOff || `— ${record.friendName}`}</p>
          </motion.article>
        )}
      </AnimatePresence>
    </div>
  );
}
