import { writable } from "svelte/store";
import { test } from "vitest";
import type { DisplayMode, OnOffState, PlaybackState } from "../config";
import { Processor } from "./Processor";
import { CreateTimeFrame } from "./TimeFrame";

test("can stop/start the Processor", () => {
  const audioSourceStore = writable(null);
  const carrierFrequencyStore = writable(100);
  const playbackStore = writable("play" as PlaybackState);
  const audioStore = writable("off" as OnOffState);
  const displayModeStore = writable("raw" as DisplayMode);
  const timeStore = writable({
    currentTime: CreateTimeFrame(),
    currentFrame: CreateTimeFrame(),
    previousFrame: CreateTimeFrame(),
    second: 0,
  });
  const eventStore = writable({ events: [] });

  const processor = new Processor(
    audioSourceStore,
    carrierFrequencyStore,
    playbackStore,
    audioStore,
    displayModeStore,
    timeStore,
    eventStore
  );

  processor.start();
  processor.stop();

  processor.start();
  processor.close();
});

test("can handle store changes", () => {
  const audioSourceStore = writable(null);
  const carrierFrequencyStore = writable(100);
  const playbackStore = writable("play" as PlaybackState);
  const audioStore = writable("off" as OnOffState);
  const displayModeStore = writable("raw" as DisplayMode);
  const timeStore = writable({
    currentTime: CreateTimeFrame(),
    currentFrame: CreateTimeFrame(),
    previousFrame: CreateTimeFrame(),
    second: 0,
  });
  const eventStore = writable({ events: [] });

  const processor = new Processor(
    audioSourceStore,
    carrierFrequencyStore,
    playbackStore,
    audioStore,
    displayModeStore,
    timeStore,
    eventStore
  );

  processor.start();

  playbackStore.set("pause");
  playbackStore.set("play");

  audioStore.set("on");
  audioStore.set("off");

  displayModeStore.set("filter");
  displayModeStore.set("rms");
  displayModeStore.set("comparator");
  displayModeStore.set("raw");
});