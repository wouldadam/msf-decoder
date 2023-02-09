import type { Writable } from "svelte/store";
import { writable } from "svelte/store";
import {
  negativePolarityFlag,
  type positivePolarityFlag,
} from "./processing/worklets/ComparatorNode";

/**
 * The MSF carrier frequency in the input audio.
 * This isn't 60kHz as the audio source will playing an audible tone.
 */
export const carrierFrequencyHz = writable(1000);

/**
 * The audio source that should be used to pull audio.
 */
export const audioSource: Writable<MediaDeviceInfo | File | string | null> =
  writable(null);

export type PlaybackState = "play" | "pause";

/**
 * Indicates the current status of playback.
 */
export const playback: Writable<PlaybackState> = writable("play");

export type OnOffState = "on" | "off";

/**
 * Indicates if audio is being played.
 */
export const audio: Writable<OnOffState> = writable("off");

export type DisplayMode = "raw" | "filter" | "rms" | "comparator";

/**
 * Indicates what data is shown in the configurable displays.
 */
export const displayMode: Writable<DisplayMode> = writable("raw");

/// Configuration for the filter stage of processing
export interface FilterConfig {
  type: BiquadFilterType;
  qValue: number;
}
export const filterConfig: Writable<FilterConfig> = writable({
  type: "bandpass",
  qValue: 1,
});

/// Configuration for the RMS stage of processing
export interface RMSConfig {
  /// Contribution of the current sample vs previous samples
  alpha: number;
}

export const rmsConfig: Writable<RMSConfig> = writable({
  alpha: 0.15,
});

/// Configuration for the comparator stage of processing
export interface ComparatorConfig {
  /// Should high or low samples be considered a 1.
  polarity: typeof positivePolarityFlag | typeof negativePolarityFlag;

  /// Values over the threshold will be considered on.
  threshold: number;
}
export const comparatorConfig: Writable<ComparatorConfig> = writable({
  polarity: negativePolarityFlag,
  threshold: 0.05,
});

/// Configuration for the MSF decode stage of processing
export interface MSFConfig {
  symbolRate: number;
}
export const msfConfig: Writable<MSFConfig> = writable({
  symbolRate: 10,
});

/// Configuration for the analyser stage of processing
export interface AnalyserConfig {
  minDecibels: number;
  maxDecibels: number;
  fftSize: number;
  smoothingTimeConstant: number;
}

export const analyserConfig: Writable<AnalyserConfig> = writable({
  minDecibels: -150,
  maxDecibels: 0,
  fftSize: 4096,
  smoothingTimeConstant: 0,
});
