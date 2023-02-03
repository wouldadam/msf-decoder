import { test } from "vitest";
import { CreateFrameValue, ValueState } from "./FrameValue";

test("CreateFrameValue creates a default initialized FrameValue", () => {
  const value = CreateFrameValue(0);

  expect(value.val).toBe(0);
  expect(value.bitCount).toBe(0);
  expect(value.state).toBe(ValueState.Unset);
});
