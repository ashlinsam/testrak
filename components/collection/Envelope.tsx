"use client";

/**
 * The sealed envelope at the end of the shelf. Not a 25th record —
 * it stays sealed until every record has been played.
 */
export function Envelope({
  unlocked,
  exploredCount,
  total,
  onOpen,
}: {
  unlocked: boolean;
  exploredCount: number;
  total: number;
  onOpen: () => void;
}) {
  const remaining = total - exploredCount;
  const body = (
    <div className={`relative transition-transform duration-500 ${unlocked ? "group-hover:-translate-y-2" : ""}`}>
      <div
        className={`paper relative aspect-square rounded-[2px] shadow-[0_2px_3px_rgba(0,0,0,.35),0_16px_28px_-14px_rgba(0,0,0,.8)] ${unlocked ? "" : "brightness-[.62] saturate-[.7]"}`}
        style={{ rotate: "1.4deg" }}
      >
        {/* flap */}
        <div
          className="absolute inset-x-0 top-0 h-[55%]"
          style={{
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            background: "linear-gradient(180deg, #e6dbc6, #d9cbb1)",
            boxShadow: "inset 0 -1px 0 rgba(0,0,0,.1)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-[55%]" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", backgroundImage: "var(--fibres)" }} />
        {/* wax seal */}
        <div className="absolute top-[55%] left-1/2 grid h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-burgundy shadow-[inset_0_2px_4px_rgba(255,255,255,.18),inset_0_-3px_6px_rgba(0,0,0,.35),0_3px_6px_rgba(0,0,0,.3)]">
          <span className="font-display text-[1.35rem] text-paper/90" style={{ fontVariationSettings: '"opsz" 72, "SOFT" 100' }}>
            24
          </span>
        </div>
        <p className="hand-a absolute inset-x-0 bottom-[12%] text-center text-[length:calc(1.5rem*var(--hand,1))] text-ink/80">for you, last</p>
      </div>
    </div>
  );

  return (
    <div>
      {unlocked ? (
        <button type="button" onClick={onOpen} className="group block w-full text-left" aria-label="Open the last note">
          {body}
        </button>
      ) : (
        <div aria-label={`A sealed envelope. It opens after all ${total} records have been played.`} role="img">
          {body}
        </div>
      )}
      <div className="relative z-10 flex h-[2.6rem] items-center justify-center">
        <span className="tape relative px-4 pt-0.5 pb-1 leading-none text-ink" style={{ rotate: "-1.5deg" }}>
          <span className="hand-a text-[length:calc(1.35rem*var(--hand,1))]">The last note</span>
        </span>
      </div>
      <p className="mt-3 px-2 text-center text-[0.8rem] leading-snug text-mist">
        {unlocked ? "It's open. Take your time." : `Opens after the last record. ${remaining} to go.`}
      </p>
    </div>
  );
}
