import type { Writable } from "svelte/store";
import { writable } from "svelte/store";

/**
 * The MSF carrier frequency in the input audio.
 * This isn't 60kHz as the audio source will playing an audible tone.
 */
export const carrierFrequencyHz = writable(1000);

/**
 * The audio source that should be used to pull audio.
 */
export const audioSource: Writable<MediaDeviceInfo | File | null> =
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
