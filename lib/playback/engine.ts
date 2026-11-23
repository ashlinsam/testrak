"use client";

import type { RecordEntry } from "@/data/types";
import { site } from "@/data/site";
import type { SpotifyEmbedController } from "./spotify";

/**
 * One playback engine for the whole site.
 *
 * Sources, in order of preference for each record:
 *   1. optionalAudioSource  → HTML5 audio, fully custom, works offline-ish on iPhone
 *   2. spotifyTrackId       → official Spotify embed (30s preview unless he's logged in
 *                              to Spotify in the same browser; full track if he is)
 *   3. site.placeholderAudio → a generated tone, only while songs are still being collected
 *
 * The turntable never decides it's "playing" on its own: it only reacts to
 * real events (`playing`, `pause`, Spotify's `playback_update`).
 * A single shared <audio> element means only one song can ever play at once.
 */

export type Source = "audio" | "spotify" | "none";
export type Status = "idle" | "loading" | "ready" | "playing" | "paused" | "ended" | "error";

export type PlaybackState = {
  recordId: string | null;
  source: Source;
  status: Status;
  buffering: boolean;
  position: number;
  duration: number;
  usingPlaceholder: boolean;
  /** The browser blocked playback until the next tap (iOS can do this). */
  needsTap: boolean;
  error: string | null;
};

const initial: PlaybackState = {
  recordId: null,
  source: "none",
  status: "idle",
  buffering: false,
  position: 0,
  duration: 0,
  usingPlaceholder: false,
  needsTap: false,
  error: null,
};

class PlaybackEngine {
  private state: PlaybackState = initial;
  private listeners = new Set<() => void>();
  private audio: HTMLAudioElement | null = null;
  private spotify: SpotifyEmbedController | null = null;
  private record: RecordEntry | null = null;
  private wantsToPlay = false;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = () => this.state;
  getServerState = () => initial;

  private set(patch: Partial<PlaybackState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  /* ---------------------------------------------------------------- */
  /* HTML5 audio                                                       */
  /* ---------------------------------------------------------------- */

  private getAudio() {
    if (this.audio) return this.audio;
    const a = new Audio();
    a.preload = "metadata";

    const isCurrent = () => this.state.source === "audio";

    a.addEventListener("loadedmetadata", () => {
      if (!isCurrent()) return;
      this.set({ duration: a.duration || 0, status: this.state.status === "loading" ? "ready" : this.state.status });
    });
    a.addEventListener("canplay", () => {
      if (isCurrent() && this.state.status === "loading") this.set({ status: "ready" });
    });
    a.addEventListener("playing", () => {
      if (isCurrent()) this.set({ status: "playing", buffering: false, needsTap: false, error: null });
    });
    a.addEventListener("pause", () => {
      if (!isCurrent() || a.ended || this.state.status === "error") return;
      this.set({ status: "paused", buffering: false });
    });
    a.addEventListener("waiting", () => {
      if (isCurrent()) this.set({ buffering: true });
    });
    a.addEventListener("timeupdate", () => {
      if (isCurrent()) this.set({ position: a.currentTime });
    });
    a.addEventListener("durationchange", () => {
      if (isCurrent() && Number.isFinite(a.duration)) this.set({ duration: a.duration });
    });
    a.addEventListener("ended", () => {
      if (!isCurrent()) return;
      this.wantsToPlay = false;
      this.set({ status: "ended", position: a.duration || this.state.position, buffering: false });
    });
    a.addEventListener("error", () => {
      if (isCurrent() && a.getAttribute("src")) this.handleAudioError();
    });

    this.audio = a;
    return a;
  }

  private handleAudioError() {
    const record = this.record;
    if (!record) return;

    // A real song is better than a tone: try Spotify first if it's configured.
    if (record.spotifyTrackId) {
      this.clearAudio();
      this.set({ source: "spotify", status: "loading", usingPlaceholder: false, error: null });
      return;
    }

    if (site.placeholderAudio && !this.state.usingPlaceholder) {
      const a = this.getAudio();
      this.set({ usingPlaceholder: true, status: "loading", error: null, position: 0, duration: 0 });
      a.src = site.placeholderAudio;
      a.load();
      if (this.wantsToPlay) this.tryPlayAudio();
      return;
    }

    this.wantsToPlay = false;
    this.set({
      status: "error",
      buffering: false,
      error:
        process.env.NODE_ENV === "development"
          ? `Couldn't load ${record.optionalAudioSource}. Check the file is in /public/audio.`
          : "This song couldn't be loaded.",
    });
  }

  private tryPlayAudio() {
    const a = this.getAudio();
    const attempt = a.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch((err: DOMException) => {
        if (err?.name === "NotAllowedError") {
          this.wantsToPlay = false;
          this.set({ needsTap: true, status: this.state.position > 0 ? "paused" : "ready", buffering: false });
        }
        // NotSupportedError / AbortError: the `error` event (or a new load) handles it.
      });
    }
  }

  private clearAudio() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
  }

  /* ---------------------------------------------------------------- */
  /* Spotify                                                           */
  /* ---------------------------------------------------------------- */

  attachSpotify(controller: SpotifyEmbedController) {
    this.spotify = controller;
    controller.addListener("ready", () => {
      if (this.state.source === "spotify" && this.state.status === "loading") this.set({ status: "ready" });
    });
    controller.addListener("playback_update", (e) => {
      if (this.state.source !== "spotify") return;
      const { isPaused, isBuffering, duration, position } = e.data;
      const ended = duration > 0 && position >= duration - 250 && isPaused;
      this.set({
        position: position / 1000,
        duration: duration / 1000,
        buffering: Boolean(isBuffering),
        status: ended ? "ended" : isPaused ? (position > 0 ? "paused" : "ready") : "playing",
        needsTap: false,
      });
    });
  }

  detachSpotify(controller: SpotifyEmbedController) {
    if (this.spotify === controller) this.spotify = null;
  }

  /* ---------------------------------------------------------------- */
  /* Public controls                                                   */
  /* ---------------------------------------------------------------- */

  /** Put a record on. Stops whatever was playing. Doesn't start playback. */
  load(record: RecordEntry) {
    if (this.record?.id === record.id && this.state.status !== "error") return;
    this.unload();
    this.record = record;

    if (record.optionalAudioSource) {
      this.set({ ...initial, recordId: record.id, source: "audio", status: "loading" });
      const a = this.getAudio();
      a.src = record.optionalAudioSource;
      a.load();
    } else if (record.spotifyTrackId) {
      this.set({ ...initial, recordId: record.id, source: "spotify", status: "loading" });
    } else if (site.placeholderAudio) {
      this.set({ ...initial, recordId: record.id, source: "audio", status: "loading", usingPlaceholder: true });
      const a = this.getAudio();
      a.src = site.placeholderAudio;
      a.load();
    } else {
      this.set({
        ...initial,
        recordId: record.id,
        status: "error",
        error: "No song has been added to this record yet.",
      });
    }
  }

  /** Must be called directly from a tap/click so iOS allows it. */
  play() {
    this.wantsToPlay = true;
    if (this.state.source === "audio") {
      const a = this.getAudio();
      if (this.state.status === "ended") a.currentTime = 0;
      this.set({ buffering: true, needsTap: false });
      this.tryPlayAudio();
    } else if (this.state.source === "spotify" && this.spotify) {
      if (this.state.status === "paused") this.spotify.resume();
      else this.spotify.play();
    }
  }

  pause() {
    this.wantsToPlay = false;
    if (this.state.source === "audio") this.audio?.pause();
    else if (this.state.source === "spotify") this.spotify?.pause();
  }

  toggle() {
    if (this.state.status === "playing") this.pause();
    else this.play();
  }

  seek(seconds: number) {
    const t = Math.max(0, Math.min(seconds, this.state.duration || seconds));
    if (this.state.source === "audio" && this.audio) {
      this.audio.currentTime = t;
      this.set({ position: t, status: this.state.status === "ended" ? "paused" : this.state.status });
    } else if (this.state.source === "spotify" && this.spotify) {
      this.spotify.seek(t);
    }
  }

  restart() {
    this.seek(0);
    this.play();
  }

  /** Take the record off: stop and forget it. */
  unload() {
    this.wantsToPlay = false;
    this.clearAudio();
    this.spotify?.pause();
    this.record = null;
    this.set({ ...initial });
  }
}

export const playback = new PlaybackEngine();
