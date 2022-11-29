import { writable, type Writable } from "svelte/store";
import type { TimeFrame } from "./processing/msf";

export interface TimeStore {
  /// The frame currently being processed
  currentFrame: TimeFrame;

  /// The last processed frame
  previousFrame: TimeFrame;

  /// The current second
  second: number | null;
}

export const timeStore: Writable<TimeStore> = writable({
  currentFrame: {},
  previousFrame: {},
  second: null,
});
