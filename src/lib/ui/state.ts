import { writable, type Writable } from "svelte/store";

/// The state of the frame view tab
export const frameView: Writable<"previous" | "current"> = writable("current");

/// The state of the settings tab
export const settingsView: Writable<"basic" | "advanced"> = writable("basic");

/// The state of the advanced settings tabs
export const advancedSettingsView: Writable<"analyser"> = writable("analyser");
