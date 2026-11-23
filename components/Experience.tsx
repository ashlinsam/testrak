"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { records } from "@/data/records";
import type { RecordEntry } from "@/data/types";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";
import { getProgress, progressActions, useProgress } from "@/lib/progress";
import { Landing } from "./landing/Landing";
import { Collection } from "./collection/Collection";
import { PlayerScene } from "./player/PlayerScene";
import { Finale } from "./finale/Finale";

type Layer = "record" | "finale";

/** History can be unavailable in some embedded/sandboxed frames; never let that break the gift. */
const safeHistory = {
  layer: (): Layer | undefined => {
    try {
      return (history.state as { layer?: Layer } | null)?.layer;
    } catch {
      return undefined;
    }
  },
  push: (layer: Layer, hash: string) => {
    try {
      history.pushState({ layer }, "", hash);
    } catch {}
  },
  replace: (layer: Layer | null, hash: string) => {
    try {
      history.replaceState(layer ? { layer } : null, "", hash);
    } catch {}
  },
};

/**
 * The whole gift, as one small state machine:
 *   landing → collection → (record | last note)
 * Overlays push a history entry, so the phone's back gesture closes them.
 */
export function Experience() {
  const reduced = usePrefersReducedMotion();
  const [view, setView] = useState<"landing" | "collection">("landing");
  const [bloom, setBloom] = useState<{ x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [finaleOpen, setFinaleOpen] = useState(false);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  /** The record whose card was just tapped; fresh = it was sealed until now. */
  const [tapped, setTapped] = useState<{ id: string; fresh: boolean } | null>(null);
  const progress = useProgress();

  const index = selectedId ? records.findIndex((r) => r.id === selectedId) : -1;
  const selected = index >= 0 ? records[index] : null;
  const overlayOpen = Boolean(selected) || finaleOpen;
  // Previous / next skip records that are still sealed.
  const prevOpen = index > 0 ? [...records.slice(0, index)].reverse().find((r) => !progress.isSealed(r.id)) : undefined;
  const nextOpen = index >= 0 ? records.slice(index + 1).find((r) => !progress.isSealed(r.id)) : undefined;

  /* -------------------- history: back gesture closes overlays -------------------- */
  useEffect(() => {
    if (window.location.hash) safeHistory.replace(null, window.location.pathname + window.location.search);
    const onPop = () => {
      setSelectedId((id) => {
        if (id) setReturnTo(id);
        return null;
      });
      setFinaleOpen(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* -------------------- NFC cards: ?card=CODE opens that record, then shows the shelf -------------------- */
  // (#card-CODE works too, for previews that can't pass a query string. Read it before the hash is tidied away.)
  const initialHash = useRef(typeof window === "undefined" ? "" : window.location.hash);
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("card") ?? initialHash.current.match(/^#card-([a-z0-9]+)$/i)?.[1] ?? null;
    if (!code) return;
    url.searchParams.delete("card");
    safeHistory.replace(null, url.pathname + url.search); // tidy the address so a refresh doesn't re-trigger it
    const record = records.find((r) => r.cardCode === code.trim().toLowerCase());
    if (!record) return;
    const before = getProgress();
    const firstVisit = before.opened.length === 0 && before.explored.length === 0;
    const fresh = progressActions.open(record.id);
    setTapped({ id: record.id, fresh });
    setReturnTo(record.id);
    // The very first visit still gets the "Unwrap your gift" opening; after that, cards go straight to the shelf.
    if (!firstVisit) setView("collection");
  }, []);

  const pushLayer = (layer: Layer, hash: string) => {
    if (safeHistory.layer()) safeHistory.replace(layer, hash);
    else safeHistory.push(layer, hash);
  };
  const popLayer = useCallback(() => {
    if (safeHistory.layer()) history.back();
    else {
      setSelectedId((id) => {
        if (id) setReturnTo(id);
        return null;
      });
      setFinaleOpen(false);
    }
  }, []);

  /* -------------------- body scroll lock under overlays -------------------- */
  useEffect(() => {
    document.body.style.overflow = overlayOpen ? "hidden" : "";
  }, [overlayOpen]);

  /* -------------------- after closing a record, hand focus back to its sleeve -------------------- */
  useEffect(() => {
    if (!returnTo || selected) return;
    const t = setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-record-button="${returnTo}"]`)?.focus({ preventScroll: true });
    }, 500);
    return () => clearTimeout(t);
  }, [returnTo, selected]);

  const openRecord = (r: RecordEntry) => {
    if (progress.isSealed(r.id)) return;
    pushLayer("record", `#${r.id}`);
    setSelectedId(r.id);
  };
  const switchRecord = (r: RecordEntry) => {
    safeHistory.replace("record", `#${r.id}`);
    setSelectedId(r.id);
  };
  const openFinale = () => {
    pushLayer("finale", "#the-last-note");
    setSelectedId(null);
    setFinaleOpen(true);
  };

  const unwrap = (origin: { x: number; y: number }) => {
    if (reduced) {
      setView("collection");
      return;
    }
    setBloom(origin);
    setTimeout(() => setView("collection"), 950);
    setTimeout(() => setBloom(null), 2600);
  };

  return (
    <>
      {/* inert while a record or the last note is open, so Tab can't wander behind it */}
      <div inert={overlayOpen}>
        <AnimatePresence mode="wait">
          {view === "landing" ? (
            <Landing key="landing" onUnwrap={unwrap} onOpenFinale={openFinale} />
          ) : (
            <Collection
              key="collection"
              onSelect={openRecord}
              onOpenFinale={openFinale}
              focusRecordId={returnTo}
              tapped={tapped}
              onDismissTapped={() => setTapped(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* warm light spilling out of the opened gift */}
      <AnimatePresence>
        {bloom && (
          <motion.div
            key="bloom"
            aria-hidden
            className="pointer-events-none fixed z-[60] rounded-full"
            style={{
              left: bloom.x,
              top: bloom.y,
              width: "300vmax",
              height: "300vmax",
              marginLeft: "-150vmax",
              marginTop: "-150vmax",
              background:
                "radial-gradient(circle, rgba(246,214,160,.98) 0%, rgba(226,170,92,.9) 18%, rgba(140,80,40,.75) 34%, rgba(42,29,22,.0) 52%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 0.85, 1.25], opacity: [0, 1, 0] }}
            transition={{ duration: 2.5, times: [0, 0.38, 1], ease: [0.45, 0, 0.2, 1] }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <PlayerScene
            key={selected.id}
            record={selected}
            total={records.length}
            onClose={popLayer}
            onPrev={prevOpen ? () => switchRecord(prevOpen) : null}
            onNext={nextOpen ? () => switchRecord(nextOpen) : null}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{finaleOpen && <Finale key="finale" onClose={popLayer} />}</AnimatePresence>
    </>
  );
}
