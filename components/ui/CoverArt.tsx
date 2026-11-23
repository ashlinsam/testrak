import type { RecordEntry } from "@/data/types";
import { identityFor, pad2, seeded } from "@/lib/identity";

/**
 * A designed sleeve cover, generated from the record number.
 * If coverImage is set in records.ts, that image is used instead.
 */
export function CoverArt({ record, className = "" }: { record: RecordEntry; className?: string }) {
  if (record.coverImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={record.coverImage}
        alt=""
        className={`block h-full w-full object-cover ${className}`}
        draggable={false}
        loading="lazy"
      />
    );
  }

  const { palette: p, motif } = identityFor(record);
  const n = record.recordNumber;
  const r = (k: number) => seeded(n * 7 + k);

  return (
    <svg viewBox="0 0 100 100" className={`block h-full w-full ${className}`} aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill={p.ground} />

      {motif === "sun" && (
        <g>
          <clipPath id={`sun-${n}`}>
            <rect width="100" height={64 + r(1) * 6} />
          </clipPath>
          <circle cx={36 + r(2) * 30} cy="62" r={22 + r(3) * 8} fill={p.ink} clipPath={`url(#sun-${n})`} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="0" y={70 + i * 6.5} width="100" height={1.6 - i * 0.25} fill={p.ink} opacity={0.55 - i * 0.1} />
          ))}
          <rect x="10" y="14" width="10" height="1.4" fill={p.accent} />
        </g>
      )}

      {motif === "rings" && (
        <g fill="none">
          {Array.from({ length: 11 }).map((_, i) => (
            <circle
              key={i}
              cx={r(1) > 0.5 ? 0 : 100}
              cy="100"
              r={16 + i * 11}
              stroke={i === 3 + Math.floor(r(2) * 4) ? p.accent : p.ink}
              strokeWidth={i % 2 ? 1.2 : 4.2}
              opacity={i % 2 ? 0.55 : 0.92}
            />
          ))}
        </g>
      )}

      {motif === "bands" && (
        <g>
          {(() => {
            const heights = [9, 2.5, 5, 1.5, 13, 3, 7, 2];
            let y = 22 + r(1) * 6;
            const accentAt = Math.floor(r(2) * heights.length);
            return heights.map((h, i) => {
              const el = (
                <rect key={i} x="0" y={y} width="100" height={h} fill={i === accentAt ? p.accent : p.ink} opacity={i % 2 ? 0.7 : 1} />
              );
              y += h + 3.2;
              return el;
            });
          })()}
        </g>
      )}

      {motif === "halves" && (
        <g>
          <polygon points={r(1) > 0.5 ? "0,100 100,8 100,100" : "0,8 100,100 0,100"} fill={p.ink} />
          <circle cx={r(1) > 0.5 ? 28 : 72} cy={30 + r(2) * 8} r="9" fill={p.accent} />
        </g>
      )}

      {motif === "dots" && (
        <g>
          {Array.from({ length: 36 }).map((_, i) => {
            const x = 22 + (i % 6) * 11.2;
            const y = 24 + Math.floor(i / 6) * 11.2;
            const special = i === Math.floor(r(1) * 36);
            return <circle key={i} cx={x} cy={y} r={special ? 4.4 : 2.1} fill={special ? p.accent : p.ink} />;
          })}
        </g>
      )}

      {motif === "numeral" && (
        <g>
          <text
            x="50"
            y="88"
            textAnchor="middle"
            fill={p.ink}
            style={{ fontFamily: "var(--font-serif)", fontSize: 84, fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1', fontWeight: 300 }}
          >
            {n}
          </text>
          <rect x="12" y="92" width="22" height="1.2" fill={p.accent} />
        </g>
      )}

      {/* Catalogue mark */}
      <text
        x="7"
        y="9.5"
        fill={motif === "numeral" ? p.accent : p.ink}
        opacity="0.85"
        style={{ fontFamily: "var(--font-sans)", fontStretch: "72%", fontSize: 4.2, letterSpacing: 0.4, fontWeight: 600 }}
      >
        No. {pad2(n)}
      </text>
    </svg>
  );
}
