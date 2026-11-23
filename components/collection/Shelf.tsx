"use client";

import { motion } from "motion/react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { RecordEntry } from "@/data/types";
import { identityFor, pad2 } from "@/lib/identity";
import { Sleeve } from "@/components/ui/Sleeve";
import { Vinyl, labelFromRecord } from "@/components/ui/Vinyl";
import { Envelope } from "./Envelope";

export type ShelfHandle = { scrollToIndex: (i: number, smooth?: boolean) => void };

type Props = {
  records: RecordEntry[];
  isExplored: (id: string) => boolean;
  exploredCount: number;
  isUnlocked: boolean;
  onSelect: (record: RecordEntry) => void;
  onOpenFinale: () => void;
  onActiveChange?: (index: number) => void;
};

export const Shelf = forwardRef<ShelfHandle, Props>(function Shelf(
  { records, isExplored, exploredCount, isUnlocked, onSelect, onOpenFinale, onActiveChange },
  ref,
) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const items = () => Array.from(scroller.current?.querySelectorAll<HTMLElement>("[data-shelf-item]") ?? []);

  const scrollToIndex = useCallback((i: number, smooth = true) => {
    const el = items()[i];
    const sc = scroller.current;
    if (!el || !sc) return;
    const target = el.offsetLeft + el.offsetWidth / 2 - sc.clientWidth / 2;
    sc.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useImperativeHandle(ref, () => ({ scrollToIndex }), [scrollToIndex]);

  // Which sleeve is nearest the middle? Drives the peeking disc on touch and the tick index.
  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const centre = sc.scrollLeft + sc.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      items().forEach((el, i) => {
        const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - centre);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
      onActiveChange?.(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    sc.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      sc.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [onActiveChange]);

  const nudge = (dir: 1 | -1) => scrollToIndex(Math.max(0, Math.min(records.length, active + dir * 3)));

  return (
    <div className="shelf-wrap relative">
      {/* the shelf itself stays put; records slide along it */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0" style={{ top: "calc(2.5rem + var(--sleeve))" }}>
        <div className="walnut h-[2.6rem] shadow-[0_18px_30px_-12px_rgba(0,0,0,.7),inset_0_1px_0_rgba(255,220,170,.18),inset_0_-3px_6px_rgba(0,0,0,.35)]" />
      </div>
      <div
        ref={scroller}
        className="shelf no-scrollbar relative overflow-x-auto overflow-y-hidden overscroll-x-contain"
        role="region"
        aria-label="Record shelf. Scroll sideways to browse."
      >
        <ul className="relative inline-flex items-start gap-[var(--gap)] pt-10 pb-10">
          {records.map((record, i) => (
            <ShelfItem
              key={record.id}
              record={record}
              index={i}
              active={i === active}
              explored={isExplored(record.id)}
              onSelect={onSelect}
            />
          ))}

          <li data-shelf-item className="relative w-[var(--sleeve)] shrink-0 snap-center lg:snap-start">
            <Envelope unlocked={isUnlocked} exploredCount={exploredCount} total={records.length} onOpen={onOpenFinale} />
          </li>
        </ul>
      </div>

      {/* desktop arrows; touch screens just swipe */}
      <div className="pointer-events-none absolute inset-x-0 hidden lg:block" style={{ top: "calc(2.5rem + var(--sleeve) / 2 - 1.5rem)" }}>
        <div className="mx-auto flex max-w-[96rem] justify-between px-4">
          <ShelfArrow label="Earlier records" onClick={() => nudge(-1)} hidden={active <= 1} flip />
          <ShelfArrow label="Later records" onClick={() => nudge(1)} hidden={active >= records.length - 1} />
        </div>
      </div>
    </div>
  );
});

function ShelfArrow({ label, onClick, hidden, flip }: { label: string; onClick: () => void; hidden: boolean; flip?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      tabIndex={hidden ? -1 : 0}
      className={`pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-night/70 text-paper shadow-lg ring-1 ring-paper/15 backdrop-blur-sm transition-opacity duration-300 hover:bg-night ${hidden ? "opacity-0" : "opacity-100"}`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden style={{ transform: flip ? "scaleX(-1)" : undefined }}>
        <path d="M6 3l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function ShelfItem({
  record,
  index,
  active,
  explored,
  onSelect,
}: {
  record: RecordEntry;
  index: number;
  active: boolean;
  explored: boolean;
  onSelect: (r: RecordEntry) => void;
}) {
  const id = identityFor(record);
  return (
    <motion.li
      data-shelf-item
      data-active={active}
      className="relative w-[var(--sleeve)] shrink-0 snap-center lg:snap-start"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.25 + Math.min(index, 8) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        onClick={() => onSelect(record)}
        data-record-button={record.id}
        aria-label={`Record ${record.recordNumber}, chosen by ${record.friendName}${explored ? `: ${record.songTitle} by ${record.artistName}, played` : ""}. Take it off the shelf.`}
        className="sleeve-btn group block w-full text-left outline-none"
      >
        <div className="sleeve-lift relative" style={{ rotate: `${id.tilt * 0.6}deg` }}>
          {/* the record, tucked inside — peeks out when you reach for it */}
          <div className="sleeve-peek absolute inset-[4%]">
            <Vinyl label={labelFromRecord(record)} sheen={false} />
          </div>
          <Sleeve record={record} className="relative shadow-[0_2px_3px_rgba(0,0,0,.35),0_16px_28px_-14px_rgba(0,0,0,.8)]" />
          <span className="sleeve-focus pointer-events-none absolute -inset-1.5 rounded-[4px]" />
        </div>
      </button>

      {/* masking-tape label on the shelf edge */}
      <div className="relative z-10 flex h-[2.6rem] items-center justify-center">
        <span
          className="tape text-ink relative px-4 pt-0.5 pb-1 leading-none"
          style={{ rotate: `${id.tilt * -1.2}deg` }}
        >
          <span className="font-spine mr-2 align-middle text-[0.7rem] font-semibold tracking-wider text-ink-soft">
            {pad2(record.recordNumber)}
          </span>
          <span className={`${id.hand} align-middle text-[length:calc(1.35rem*var(--hand,1))]`}>{record.friendName}</span>
        </span>
      </div>

      <div className="mt-3 min-h-10 px-1 text-center">
        {explored ? (
          <p className="text-[0.8rem] leading-snug text-mist">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 -translate-y-px rounded-full bg-amber align-middle" aria-hidden />
            <span className="font-display italic" style={{ fontVariationSettings: '"opsz" 14, "SOFT" 100' }}>
              {record.songTitle}
            </span>
          </p>
        ) : null}
      </div>
    </motion.li>
  );
}
