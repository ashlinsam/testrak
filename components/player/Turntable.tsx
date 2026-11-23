"use client";

import { useEffect, useRef } from "react";
import "./turntable.css";
import type { RecordEntry } from "@/data/types";
import { Sleeve } from "@/components/ui/Sleeve";
import { Vinyl, labelFromRecord } from "@/components/ui/Vinyl";

export type Stage = "arriving" | "drawing" | "placing" | "cued";

/** Tonearm angles (degrees from resting straight down). Geometry lives in the SVG below. */
export const ARM = { rest: 0, cue: 21, leadIn: 25.5, runOut: 44 } as const;

const RPM_33 = 200; // 33⅓ rpm in degrees per second

type Props = {
  record: RecordEntry;
  stage: Stage;
  spinning: boolean;
  armAngle: number;
  armLowered: boolean;
  armTracking: boolean;
  powerOn: boolean;
  armLabel: string;
  onArmTap: () => void;
};

export function Turntable({ record, stage, spinning, armAngle, armLowered, armTracking, powerOn, armLabel, onArmTap }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const spinRef = useRef(spinning);
  spinRef.current = spinning;
  const loop = useRef<{ raf: number; v: number; a: number; t: number }>({ raf: 0, v: 0, a: 0, t: 0 });

  // A tiny physics loop: the platter spins up in about a second and coasts to a stop,
  // instead of snapping on and off.
  useEffect(() => {
    const L = loop.current;
    const tick = (now: number) => {
      const dt = L.t ? Math.min((now - L.t) / 1000, 0.05) : 0;
      L.t = now;
      const target = spinRef.current ? RPM_33 : 0;
      const tau = spinRef.current ? 0.32 : 0.55;
      L.v += (target - L.v) * (1 - Math.exp(-dt / tau));
      L.a = (L.a + L.v * dt) % 360;
      root.current?.style.setProperty("--angle", `${L.a.toFixed(2)}deg`);
      if (!spinRef.current && L.v < 0.4) {
        L.v = 0;
        L.raf = 0;
        L.t = 0;
        return;
      }
      L.raf = requestAnimationFrame(tick);
    };
    if (spinning && !L.raf) L.raf = requestAnimationFrame(tick);
    return () => {
      // keep coasting across re-renders; the loop stops itself
    };
  }, [spinning]);

  useEffect(() => () => cancelAnimationFrame(loop.current.raf), []);

  return (
    <div ref={root} className="tt" data-stage={stage}>
      <div className="tt-plinth walnut">
        <div className="tt-plate" />
      </div>

      <div className="tt-platter" aria-hidden>
        <div className="tt-platter-rotor" />
      </div>
      <div className="tt-led" data-on={powerOn} aria-hidden />

      <div className="tt-disc" aria-hidden>
        <Vinyl label={labelFromRecord(record)} />
        <div className="tt-spindle" style={{ left: "48.8%", top: "48.8%", width: "2.4%", height: "2.4%" }} />
      </div>

      <div className="tt-sleeve" aria-hidden>
        <div className="tt-sleeve-inner">
          <Sleeve record={record} />
        </div>
      </div>

      <Tonearm angle={armAngle} lowered={armLowered} tracking={armTracking} />

      <button type="button" className="tt-arm-hit" onClick={onArmTap} aria-label={armLabel} disabled={stage !== "cued"} />
    </div>
  );
}

/**
 * The tonearm, drawn in the deck's own 100×80 coordinate space.
 * Pivot at (84,14); the stylus sits ~50.8 units away, which reaches the
 * lead-in groove at ~25° and the run-out groove at ~44°.
 */
function Tonearm({ angle, lowered, tracking }: { angle: number; lowered: boolean; tracking: boolean }) {
  const metal = "url(#tt-metal)";
  const shadowOffset = lowered ? "translate(0.5px, 0.8px)" : "translate(1.8px, 2.8px)";

  const armShape = (fill: string, stroke: string) => (
    <>
      {/* counterweight */}
      <rect x="80.6" y="2.6" width="6.8" height="6.4" rx="1.1" fill={fill === "shadow" ? stroke : "url(#tt-weight)"} />
      {/* tube */}
      <path d="M84 9 L84 55.6 L82.9 59.6" fill="none" stroke={fill === "shadow" ? stroke : metal} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
      {/* headshell */}
      <path d="M81.1 58.9 L84.6 59.9 L84.1 64.6 L81.4 64.1 Z" fill={fill === "shadow" ? stroke : "#1b1816"} stroke={fill === "shadow" ? "none" : "#5c564e"} strokeWidth=".25" />
      {/* finger lift */}
      <path d="M84.4 61.2 L86.6 61.8" stroke={fill === "shadow" ? stroke : metal} strokeWidth=".55" strokeLinecap="round" />
    </>
  );

  return (
    <svg className="tt-arm" viewBox="0 0 100 80" aria-hidden>
      <defs>
        <linearGradient id="tt-metal" x1="0" x2="1">
          <stop offset="0" stopColor="#8f8a82" />
          <stop offset=".45" stopColor="#f1ece3" />
          <stop offset="1" stopColor="#77726b" />
        </linearGradient>
        <radialGradient id="tt-weight" cx=".35" cy=".3" r=".9">
          <stop offset="0" stopColor="#5a554e" />
          <stop offset="1" stopColor="#1d1b18" />
        </radialGradient>
        <radialGradient id="tt-bearing" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#f3ede2" />
          <stop offset=".6" stopColor="#8d877d" />
          <stop offset="1" stopColor="#3c3833" />
        </radialGradient>
        <filter id="tt-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation=".7" />
        </filter>
      </defs>

      {/* base + arm rest */}
      <rect x="76.5" y="5.5" width="15" height="17" rx="2.2" fill="#14110f" opacity=".85" />
      <circle cx="84" cy="14" r="6.2" fill="#24201c" stroke="rgba(255,255,255,.06)" strokeWidth=".3" />
      <rect x="82.6" y="47.5" width="2.8" height="3.6" rx=".6" fill="#2d2925" stroke="rgba(255,255,255,.07)" strokeWidth=".2" />
      <circle cx="92.5" cy="31" r="1.4" fill="#2d2925" />
      <rect x="91.9" y="26" width="1.2" height="5" rx=".5" fill="#6d675f" />

      <g className="tt-arm-rotor" data-tracking={tracking} style={{ transform: `rotate(${angle}deg)` }}>
        <g className="tt-arm-shadow" style={{ transform: shadowOffset }} filter="url(#tt-blur)" opacity={lowered ? 0.55 : 0.4}>
          {armShape("shadow", "#000")}
        </g>
        {armShape("metal", "")}
        <circle cx="84" cy="14" r="3.4" fill="url(#tt-bearing)" />
        <circle cx="84" cy="14" r="1.2" fill="#2a2622" />
      </g>
    </svg>
  );
}
