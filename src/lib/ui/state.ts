import { writable, type Writable } from "svelte/store";

export const frameView: Writable<"previous" | "current"> = writable("current");
