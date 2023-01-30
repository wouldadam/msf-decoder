import { writable, type Writable } from "svelte/store";
import { CreateTimeFrame, type TimeFrame } from "./processing/msf";
import type { MSFMsg } from "./worklets/MSFNode";

export interface TimeStore {
  /// The current time based on all decoded frames
  currentTime: TimeFrame;

  /// The frame currently being processed
  currentFrame: TimeFrame;

  /// The last processed frame
  previousFrame: TimeFrame;

  /// The current second
  second: number | null;
}

export const timeStore: Writable<TimeStore> = writable({
  currentTime: CreateTimeFrame(),
  currentFrame: CreateTimeFrame(),
  previousFrame: CreateTimeFrame(),
  second: null,
});

export interface EventStore {
  events: MSFMsg[];
}

export const maxEvents = 99;
export const eventStore: Writable<EventStore> = writable({ events: [] });
