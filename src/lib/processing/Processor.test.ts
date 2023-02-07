import { writable } from "svelte/store";
import { test } from "vitest";
import type { DisplayMode, OnOffState, PlaybackState } from "../config";
import { Processor } from "./Processor";
import { CreateTimeFrame } from "./TimeFrame";
import { negativePolarityFlag } from "./worklets/ComparatorNode";

function createProcessor() {
  const audioSourceStore = writable(null);
  const carrierFrequencyStore = writable(100);
  const playbackStore = writable("play" as PlaybackState);
  const audioStore = writable("off" as OnOffState);
  const displayModeStore = writable("raw" as DisplayMode);
  const filterConfigStore = writable({
    type: "bandpass" as BiquadFilterType,
    qValue: 1,
  });
  const rmsConfigStore = writable({ alpha: 0.15 });
  const comparatorStore = writable({
    polarity: negativePolarityFlag as typeof negativePolarityFlag,
    threshold: 0.5,
  });
  const msfConfigStore = writable({ symbolRate: 10 });
  const analyserConfigStore = writable({
    minDecibels: -100,
    maxDecibels: 0,
    fftSize: 1024,
    smoothingTimeConstant: 0,
  });
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
    filterConfigStore,
    rmsConfigStore,
    comparatorStore,
    msfConfigStore,
    analyserConfigStore,
    timeStore,
    eventStore
  );

  return [processor, playbackStore, audioStore, displayModeStore] as const;
}

test("can stop/start the Processor", () => {
  const [processor, playbackStore, audioStore, displayModeStore] =
    createProcessor();

  processor.start();
  processor.stop();

  processor.start();
  processor.close();
});

test("can handle store changes", () => {
  const [processor, playbackStore, audioStore, displayModeStore] =
    createProcessor();

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
