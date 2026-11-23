"use client";

import type { PlaybackState } from "@/lib/playback/engine";
import { formatTime } from "@/lib/identity";

/**
 * The front edge of the deck: start/stop, the seek groove, time and restart.
 * Deliberately not a media-player bar — it's part of the turntable's case.
 */
export function DeckControls({
  state,
  disabled,
  onToggle,
  onSeek,
  onRestart,
}: {
  state: PlaybackState;
  disabled: boolean;
  onToggle: () => void;
  onSeek: (t: number) => void;
  onRestart: () => void;
}) {
  const playing = state.status === "playing";
  const pct = state.duration > 0 ? (state.position / state.duration) * 100 : 0;
  const canSeek = state.duration > 0 && state.source !== "none";

  return (
    <div className="tt-fascia walnut flex items-center gap-3 px-[max(0.9rem,calc(var(--u)*3))] pt-4 pb-3.5 shadow-[0_18px_30px_-16px_rgba(0,0,0,.8)] sm:gap-4">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        data-deck-key
        aria-label={playing ? "Pause" : state.status === "ended" ? "Play again" : "Play"}
        className="tt-key grid h-12 w-14 shrink-0 place-items-center rounded-[5px] text-paper disabled:opacity-50"
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <rect x="3" y="2.5" width="3.4" height="11" rx=".8" fill="currentColor" />
            <rect x="9.6" y="2.5" width="3.4" height="11" rx=".8" fill="currentColor" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path d="M4.5 2.6v10.8c0 .5.5.8.9.5l8.1-5.4c.4-.3.4-.8 0-1.1L5.4 2.1c-.4-.3-.9 0-.9.5z" fill="currentColor" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <input
          type="range"
          className="tt-seek block"
          min={0}
          max={state.duration || 1}
          step={0.1}
          value={Math.min(state.position, state.duration || 0)}
          disabled={!canSeek}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Position in song"
          aria-valuetext={`${formatTime(state.position)} of ${formatTime(state.duration)}`}
          style={{ ["--p" as string]: `${pct}%` }}
        />
        <div className="font-spine -mt-0.5 flex justify-between text-[0.72rem] tracking-wide text-mist/75 tabular-nums">
          <span>{formatTime(state.position)}</span>
          <span>{state.duration ? formatTime(state.duration) : "–:––"}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRestart}
        disabled={disabled || !canSeek}
        aria-label="Restart song"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-mist transition-colors hover:text-paper disabled:opacity-35"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path d="M4.2 6.2A6 6 0 1 1 3 9.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3.4 2.8v3.8h3.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
