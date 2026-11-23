"use client";

/**
 * Minimal typing + loader for Spotify's official iFrame API.
 * https://developer.spotify.com/documentation/embeds/references/iframe-api
 *
 * What it can and can't do (so the site never over-promises):
 * - Plays inside Spotify's own embed, which must stay visible.
 * - Without a Spotify login in the same browser: 30-second previews.
 * - Logged in (Free or Premium): full tracks.
 * - iPhone Safari may require tapping play inside the embed itself.
 *   The turntable only spins once Spotify reports that playback started.
 */

export type SpotifyPlaybackUpdate = {
  data: { isPaused: boolean; isBuffering: boolean; duration: number; position: number };
};

export type SpotifyEmbedController = {
  play(): void;
  pause(): void;
  resume(): void;
  togglePlay(): void;
  seek(seconds: number): void;
  loadUri(uri: string): void;
  destroy(): void;
  addListener(event: "ready", cb: () => void): void;
  addListener(event: "playback_update", cb: (e: SpotifyPlaybackUpdate) => void): void;
};

export type SpotifyIFrameAPI = {
  createController(
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number; theme?: "dark" },
    callback: (controller: SpotifyEmbedController) => void,
  ): void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}

let apiPromise: Promise<SpotifyIFrameAPI> | null = null;

export function loadSpotifyApi(): Promise<SpotifyIFrameAPI> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = (api) => resolve(api);
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("Spotify couldn't be reached."));
    };
    document.body.appendChild(script);
  });
  return apiPromise;
}

export function spotifyOpenUrl(record: { spotifyUrl?: string; spotifyTrackId?: string }) {
  if (record.spotifyUrl) return record.spotifyUrl;
  if (record.spotifyTrackId) return `https://open.spotify.com/track/${record.spotifyTrackId}`;
  return null;
}
