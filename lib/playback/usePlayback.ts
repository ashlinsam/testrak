"use client";

import { useSyncExternalStore } from "react";
import { playback } from "./engine";

export function usePlayback() {
  return useSyncExternalStore(playback.subscribe, playback.getState, playback.getServerState);
}

export { playback };
