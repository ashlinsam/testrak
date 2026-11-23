import type { RecordEntry } from "@/data/types";
import { site } from "@/data/site";

/**
 * Every record gets its own visual identity from its number:
 * a palette, a cover motif, a handwriting and a little bit of
 * hand-placed imperfection (tilt, ring wear). Eight palettes and six
 * motifs give 24 unique pairings — no two covers repeat.
 */

export type Palette = {
  name: string;
  ground: string; // cover background
  ink: string; // main shape
  accent: string; // small detail
  label: string; // vinyl centre label
  labelInk: string;
};

export const palettes: Palette[] = [
  { name: "oxblood", ground: "#6e2430", ink: "#efe6d4", accent: "#d9a04a", label: "#6e2430", labelInk: "#efe6d4" },
  { name: "ivory", ground: "#e9dfcb", ink: "#2a1d16", accent: "#6e2430", label: "#e9dfcb", labelInk: "#2a1d16" },
  { name: "amber", ground: "#c98b3a", ink: "#2a1d16", accent: "#efe6d4", label: "#d9a04a", labelInk: "#2a1d16" },
  { name: "espresso", ground: "#2a1d16", ink: "#d9a04a", accent: "#efe6d4", label: "#3a2a20", labelInk: "#e8c48a" },
  { name: "sage", ground: "#8a8c6c", ink: "#efe6d4", accent: "#2a1d16", label: "#8a8c6c", labelInk: "#1f1b14" },
  { name: "dusk", ground: "#4c5a63", ink: "#e8c48a", accent: "#efe6d4", label: "#4c5a63", labelInk: "#efe6d4" },
  { name: "rose", ground: "#c49a88", ink: "#4a1820", accent: "#efe6d4", label: "#c49a88", labelInk: "#3a141a" },
  { name: "charcoal", ground: "#1f1b17", ink: "#efe6d4", accent: "#b9473f", label: "#2a2520", labelInk: "#efe6d4" },
];

export const motifs = ["sun", "rings", "bands", "halves", "dots", "numeral"] as const;
export type Motif = (typeof motifs)[number];

const hands = ["hand-a", "hand-b", "hand-c", "hand-d"] as const;

/** Small deterministic pseudo-random from a seed, so tilts never jump between renders. */
export function seeded(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function identityFor(record: Pick<RecordEntry, "recordNumber">) {
  const i = record.recordNumber - 1;
  return {
    palette: palettes[i % palettes.length],
    motif: motifs[i % motifs.length] as Motif,
    hand: hands[(i * 3) % hands.length],
    tilt: (seeded(record.recordNumber) - 0.5) * 2.2, // degrees
    wear: 0.05 + seeded(record.recordNumber + 40) * 0.09, // ring-wear opacity
    noteHeading: site.noteHeadings[i % site.noteHeadings.length],
  };
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
