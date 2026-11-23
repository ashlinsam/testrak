"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RecordEntry } from "@/data/types";
import { identityFor, pad2 } from "@/lib/identity";
import { progressActions } from "@/lib/progress";
import { playback, usePlayback } from "@/lib/playback/usePlayback";
import { spotifyOpenUrl } from "@/lib/playback/spotify";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";
import { LinerNote } from "@/components/notes/LinerNote";
import { ARM, Turntable, type Stage } from "./Turntable";
import { DeckControls } from "./DeckControls";
import { SpotifyDeck } from "./SpotifyDeck";

type Props = {
  record: RecordEntry;
  total: number;
  onClose: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
};

/**
 * One record out of its sleeve: the turntable, the song and the note.
 * Keyed by record id, so changing records always stops the old song and
 * replays the whole put-it-on ritual.
 */
export function PlayerScene({ record, total, onClose, onPrev, onNext }: Props) {
  const pb = usePlayback();
  const reduced = usePrefersReducedMotion();
  const [stage, setStage] = useState<Stage>("arriving");
  const [noteOpen, setNoteOpen] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const id = identityFor(record);
  const mine = pb.recordId === record.id;

  // Put the record on (loads metadata only; nothing plays until a tap).
  useEffect(() => {
    playback.load(record);
    progressActions.setLast(record.id);
    return () => {
      // Only take it off if a newer record hasn't already replaced it.
      if (playback.getState().recordId === record.id) playback.unload();
    };
  }, [record]);

  // The ritual: sleeve → record slides out → onto the platter → tonearm swings over.
  useEffect(() => {
    if (reduced) {
      setStage("cued");
      return;
    }
    const t = [
      setTimeout(() => setStage("drawing"), 450),
      setTimeout(() => setStage("placing"), 1250),
      setTimeout(() => setStage("cued"), 2150),
    ];
    return () => t.forEach(clearTimeout);
  }, [reduced]);

  // The note slides out the first time the song actually starts.
  useEffect(() => {
    if (mine && pb.status === "playing") setNoteOpen(true);
  }, [mine, pb.status]);

  useEffect(() => {
    if (noteOpen) progressActions.markExplored(record.id);
  }, [noteOpen, record.id]);

  const toggle = useCallback(() => {
    if (pb.status === "playing") return playback.pause();
    setStage("cued");
    playback.play(); // called straight from the tap, as iOS requires
  }, [pb.status]);

  const close = useCallback(() => {
    playback.pause();
    onClose();
  }, [onClose]);

  // Move focus into the scene, onto the deck's play key.
  useEffect(() => {
    sceneRef.current?.querySelector<HTMLButtonElement>("[data-deck-key]")?.focus({ preventScroll: true });
  }, []);

  // Keyboard: Space plays/pauses, Escape returns to the shelf.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "Escape") close();
      if (e.key === " " && !["BUTTON", "INPUT", "A", "TEXTAREA"].includes(tag)) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, close]);

  /* ---------------- derive the deck's physical state ---------------- */
  const status = mine ? pb.status : "loading";
  const p = pb.duration > 0 ? Math.min(pb.position / pb.duration, 1) : 0;
  const playing = status === "playing";
  const needleDown = playing || (pb.buffering && (status === "ready" || status === "loading"));
  const pausedMidway = status === "paused" && pb.position > 0;

  let armAngle: number = ARM.rest;
  if (stage === "cued") {
    armAngle = needleDown || pausedMidway ? ARM.leadIn + p * (ARM.runOut - ARM.leadIn) : ARM.cue;
  }

  const spotifyWaiting = pb.source === "spotify" && status === "loading";
  const controlsDisabled = status === "error" || spotifyWaiting || pb.source === "none";

  const statusText = (() => {
    if (!mine) return "Putting the record on…";
    if (pb.error) return pb.error;
    if (pb.needsTap) return "Your phone paused it. Tap play once more.";
    if (spotifyWaiting) return "Loading Spotify…";
    if (needleDown && !playing) return "Lowering the needle…";
    if (status === "ended") return "That's the end of the side. Play it again, or pick another record.";
    if (playing || pausedMidway) return pb.usingPlaceholder ? "Placeholder tone. The real song hasn't been added yet." : "";
    if (stage !== "cued") return "Putting the record on…";
    return "Press play, or tap the tonearm.";
  })();

  const openUrl = spotifyOpenUrl(record);

  return (
    <motion.div
      ref={sceneRef}
      className="room fixed inset-0 z-40 overflow-x-hidden overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label={`Record ${record.recordNumber}: ${record.songTitle} by ${record.artistName}, chosen by ${record.friendName}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {/* header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-room via-room/90 to-transparent pb-4">
        <div className="mx-auto flex max-w-[84rem] items-center justify-between gap-3 px-4 pt-[max(0.9rem,env(safe-area-inset-top))] sm:px-8">
          <button type="button" onClick={close} className="-ml-1 flex items-center gap-2 rounded-full px-3 py-2.5 text-sm text-mist hover:text-paper">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to the shelf
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev ?? undefined}
              disabled={!onPrev}
              aria-label="Previous record"
              className="grid h-10 w-10 place-items-center rounded-full text-mist hover:text-paper disabled:opacity-25"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="font-spine min-w-14 text-center text-sm text-mist tabular-nums">
              {pad2(record.recordNumber)} <span className="text-mist/45">/ {total}</span>
            </span>
            <button
              type="button"
              onClick={onNext ?? undefined}
              disabled={!onNext}
              aria-label="Next record"
              className="grid h-10 w-10 place-items-center rounded-full text-mist hover:text-paper disabled:opacity-25"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="player-layout mx-auto max-w-[84rem] px-4 pb-[max(3rem,env(safe-area-inset-bottom))] sm:px-8">
        {/* the deck */}
        <div className="player-deck">
          <Turntable
            record={record}
            stage={stage}
            spinning={playing && !reduced}
            armAngle={armAngle}
            armLowered={needleDown}
            armTracking={stage === "cued" && (needleDown || pausedMidway)}
            powerOn={playing || needleDown}
            armLabel={playing ? "Lift the needle to pause" : "Lower the needle to play"}
            onArmTap={toggle}
          />
          <DeckControls
            state={mine ? pb : { ...pb, status: "loading", position: 0, duration: 0 }}
            disabled={controlsDisabled}
            onToggle={toggle}
            onSeek={(t) => playback.seek(t)}
            onRestart={() => {
              setStage("cued");
              playback.restart();
            }}
          />
          <p className="mt-3 min-h-6 w-[var(--tt)] text-[0.85rem] text-mist/85" aria-live="polite">
            {statusText}
            {status === "error" && openUrl && (
              <>
                {" "}
                <a href={openUrl} target="_blank" rel="noreferrer" className="text-amber-soft underline decoration-amber/40 underline-offset-4">
                  Open it in Spotify
                </a>
              </>
            )}
          </p>
          {pb.source === "spotify" && mine && <SpotifyDeck record={record} />}
        </div>

        {/* who chose it, and why */}
        <div className="player-words">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: reduced ? 0 : 1.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[0.95rem] text-mist">
              Chosen for you by
              <span className={`${id.hand} ml-2 inline-block -rotate-2 text-[length:calc(1.9rem*var(--hand,1))] leading-none text-amber-soft`}>{record.friendName}</span>
            </p>
            <h2
              className="font-display mt-4 text-[clamp(2rem,5.4vw,3.6rem)] leading-[1.02] font-[360] text-paper"
              style={{ textWrap: "balance" }}
            >
              {record.songTitle}
            </h2>
            <p className="mt-2 text-[1.05rem] text-mist">{record.artistName}</p>
          </motion.div>

          <div className="mt-8 sm:mt-10">
            <LinerNote record={record} open={noteOpen} onOpen={() => setNoteOpen(true)} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
