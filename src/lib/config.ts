import { writable } from "svelte/store";
import type { Writable } from "svelte/store";

/**
 * The MSF carrier frequency in the input audio.
 * This isn't 60kHz as the audio source will playing an audible tone.
 */
export const carrierFrequencyHz = writable(500);

/**
 * The media device that should be used to pull audio from.
 */
export const mediaDevice: Writable<MediaDeviceInfo | null> = writable(null);
