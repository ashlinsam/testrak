import type { CSSProperties } from "react";
import { identityFor, pad2, seeded } from "@/lib/identity";
import type { Palette } from "@/lib/identity";

type LabelContent = {
  top: string;
  bottom: string;
  centre: string;
  palette: Palette;
  seed: number;
};

export function labelFromRecord(record: {
  recordNumber: number;
  songTitle: string;
  artistName: string;
  friendName: string;
}): LabelContent {
  const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
  return {
    top: clip(`${record.songTitle}  —  ${record.artistName}`, 44),
    bottom: clip(`chosen by ${record.friendName}`, 30),
    centre: pad2(record.recordNumber),
    palette: identityFor(record).palette,
    seed: record.recordNumber,
  };
}

/**
 * A vinyl record. The grooves and label sit on a rotor that turns with the
 * `--angle` custom property set by the turntable; the reflection layer on top
 * stays still, the way light on a real record does.
 */
export function Vinyl({
  label,
  className = "",
  style,
  sheen = true,
}: {
  label: LabelContent;
  className?: string;
  style?: CSSProperties;
  sheen?: boolean;
}) {
  const { palette: p, seed } = label;
  const id = `lbl-${seed}-${label.centre}`;

  return (
    <div className={`relative aspect-square ${className}`} style={style}>
      <div className="vinyl absolute inset-0" style={{ transform: "rotate(var(--angle, 0deg))" }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <path id={`${id}-top`} d="M 36.5,50 a 13.5,13.5 0 1,1 27,0 a 13.5,13.5 0 1,1 -27,0" />
            <path id={`${id}-bot`} d="M 34.2,50 a 15.8,15.8 0 0,0 31.6,0" />
          </defs>
          {/* label */}
          <circle cx="50" cy="50" r="17.2" fill={p.label} />
          <circle cx="50" cy="50" r="17.2" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth=".4" />
          <circle cx="50" cy="50" r="10.2" fill="none" stroke={p.labelInk} strokeWidth=".18" opacity=".55" />
          <text fill={p.labelInk} style={{ fontFamily: "var(--font-sans)", fontStretch: "80%", fontSize: 2.35, letterSpacing: 0.18, fontWeight: 600 }}>
            <textPath href={`#${id}-top`} startOffset="25%" textAnchor="middle">
              {label.top}
            </textPath>
          </text>
          <text fill={p.labelInk} opacity=".85" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 2.4 }}>
            <textPath href={`#${id}-bot`} startOffset="50%" textAnchor="middle">
              {label.bottom}
            </textPath>
          </text>
          <text
            x="50"
            y="47.6"
            textAnchor="middle"
            fill={p.labelInk}
            style={{ fontFamily: "var(--font-serif)", fontSize: 6.2, fontVariationSettings: '"opsz" 72, "SOFT" 100', fontWeight: 400 }}
          >
            {label.centre}
          </text>
          <text
            x="50"
            y="56.4"
            textAnchor="middle"
            fill={p.labelInk}
            opacity=".7"
            style={{ fontFamily: "var(--font-sans)", fontStretch: "72%", fontSize: 2, letterSpacing: 0.3 }}
          >
            33⅓
          </text>
          {/* spindle hole */}
          <circle cx="50" cy="50" r="1.15" fill="#0b0908" />
          {/* a couple of dust specks, so you can see it turn */}
          <circle cx={50 + 26 * Math.cos(seed)} cy={50 + 26 * Math.sin(seed)} r=".22" fill="#fff" opacity=".22" />
          <circle cx={50 + 39 * Math.cos(seed * 2.3)} cy={50 + 39 * Math.sin(seed * 2.3)} r=".16" fill="#fff" opacity={0.12 + seeded(seed) * 0.1} />
        </svg>
      </div>
      {sheen && <div className="vinyl-sheen pointer-events-none absolute inset-0" />}
    </div>
  );
}
