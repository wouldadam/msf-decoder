import { test } from "vitest";
import type FrameValue from "../ui/time/FrameValue.svelte";
import { ValueState } from "./FrameValue";
import { CreateTimeFrame } from "./TimeFrame";

test("CreateTimeFrame creates a default initialized TimeFrame", () => {
  const frame = CreateTimeFrame();

  for (const key in frame) {
    const frameValue = frame[key] as FrameValue;
    expect(frameValue.bitCount).toBe(0);
    expect(frameValue.state).toBe(ValueState.Unset);
  }
});
