import type { RecordEntry } from "@/data/types";
import { identityFor } from "@/lib/identity";
import { CoverArt } from "./CoverArt";

/**
 * The cardboard sleeve: cover art plus the small imperfections real sleeves
 * pick up over the years — ring wear, softened edges, a faint fibre texture.
 */
export function Sleeve({ record, className = "" }: { record: RecordEntry; className?: string }) {
  const { wear } = identityFor(record);
  return (
    <div className={`relative aspect-square overflow-hidden rounded-[2px] ${className}`}>
      <CoverArt record={record} />
      {/* ring wear: the record inside has pressed its outline into the card */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: "5.5%",
          boxShadow: `0 0 0 1.5px rgba(255,248,235,${wear}), inset 0 0 0 1px rgba(0,0,0,${wear * 0.6})`,
        }}
      />
      {/* fibres + softened, slightly lighter edges */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply"
        style={{ backgroundImage: "var(--fibres)", opacity: 0.55 }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(255,245,225,.16), inset 0 0 14px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.12)",
        }}
      />
    </div>
  );
}
