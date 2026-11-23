"use client";

import { useSyncExternalStore } from "react";
import { records } from "@/data/records";
import { site } from "@/data/site";

/**
 * Progress lives in localStorage, so he never loses his place after a refresh.
 * A record counts as explored once its note has been revealed.
 * With card unlock on, a record is sealed until its NFC card has been tapped.
 *
 * Handy while building:  ?unlock  → open and explore every record
 *                        ?reset   → clear progress
 */

const KEY = "24-rotations:v1";

export type Progress = {
  explored: string[];
  /** Records whose NFC card has been tapped. */
  opened: string[];
  finaleSeen: boolean;
  lastRecordId: string | null;
};

const empty: Progress = { explored: [], opened: [], finaleSeen: false, lastRecordId: null };

let state: Progress = empty;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const valid = new Set(records.map((r) => r.id));
    return {
      explored: (parsed.explored ?? []).filter((id) => valid.has(id)),
      opened: (parsed.opened ?? []).filter((id) => valid.has(id)),
      finaleSeen: Boolean(parsed.finaleSeen),
      lastRecordId: parsed.lastRecordId ?? null,
    };
  } catch {
    return empty;
  }
}

function write(next: Progress) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode or storage full: progress just won't persist */
  }
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = read();
  const params = new URLSearchParams(window.location.search);
  if (params.has("reset")) write(empty);
  if (params.has("unlock")) write({ ...state, explored: records.map((r) => r.id), opened: records.map((r) => r.id) });
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = read();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProgress() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      hydrate();
      return state;
    },
    () => empty,
  );
  const exploredCount = snapshot.explored.length;
  return {
    ...snapshot,
    exploredCount,
    isUnlocked: exploredCount >= records.length,
    isExplored: (id: string) => snapshot.explored.includes(id),
    /** Sealed = card unlock is on and this record's card hasn't been tapped yet. */
    isSealed: (id: string) => site.cardUnlock && !snapshot.opened.includes(id),
    openedCount: site.cardUnlock ? snapshot.opened.length : records.length,
  };
}

/** Current progress, read straight from storage (safe inside effects). */
export function getProgress(): Progress {
  hydrate();
  return state;
}

export const progressActions = {
  markExplored(id: string) {
    hydrate();
    if (state.explored.includes(id)) return write({ ...state, lastRecordId: id });
    write({ ...state, explored: [...state.explored, id], lastRecordId: id });
  },
  /** A card was tapped. Returns true if this record was sealed until now. */
  open(id: string) {
    hydrate();
    if (state.opened.includes(id)) {
      write({ ...state, lastRecordId: id });
      return false;
    }
    write({ ...state, opened: [...state.opened, id], lastRecordId: id });
    return true;
  },
  setLast(id: string) {
    hydrate();
    write({ ...state, lastRecordId: id });
  },
  markFinaleSeen() {
    hydrate();
    write({ ...state, finaleSeen: true });
  },
};
