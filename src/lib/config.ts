import { writable } from "svelte/store";
import type { Writable } from "svelte/store";

export const carrierFrequencyHz = writable(500);

export const mediaDevice: Writable<MediaDeviceInfo | null> = writable(null);
