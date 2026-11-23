"use client";

import { useEffect, useRef, useState } from "react";
import type { RecordEntry } from "@/data/types";
import { playback } from "@/lib/playback/engine";
import { loadSpotifyApi, spotifyOpenUrl, type SpotifyEmbedController } from "@/lib/playback/spotify";

/**
 * Spotify's official embed, shown under the deck when a record has no local
 * audio file. Spotify requires the embed to be visible; we keep it small and
 * let its playback events drive the turntable.
 */
export function SpotifyDeck({ record }: { record: RecordEntry }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const openUrl = spotifyOpenUrl(record);

  useEffect(() => {
    if (!record.spotifyTrackId || !host.current) return;
    let controller: SpotifyEmbedController | null = null;
    let cancelled = false;
    const mount = document.createElement("div");
    host.current.appendChild(mount);

    loadSpotifyApi()
      .then((api) => {
        if (cancelled) return;
        api.createController(mount, { uri: `spotify:track:${record.spotifyTrackId}`, width: "100%", height: 80, theme: "dark" }, (c) => {
          if (cancelled) return c.destroy();
          controller = c;
          playback.attachSpotify(c);
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (controller) {
        playback.detachSpotify(controller);
        controller.destroy();
      }
      mount.remove();
    };
  }, [record.spotifyTrackId]);

  return (
    <div className="mt-4 w-[var(--tt)]">
      {!failed && <div ref={host} className="min-h-20 overflow-hidden rounded-xl" />}
      <p className="mt-2 text-[0.8rem] leading-relaxed text-mist/80">
        {failed ? "Spotify couldn't be reached. " : "Playing through Spotify. Log in to Spotify in this browser to hear the full song, not just a preview. "}
        {openUrl && (
          <a href={openUrl} target="_blank" rel="noreferrer" className="text-amber-soft underline decoration-amber/40 underline-offset-4">
            Open in Spotify
          </a>
        )}
      </p>
    </div>
  );
}
