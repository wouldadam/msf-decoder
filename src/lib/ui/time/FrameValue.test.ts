import { render } from "@testing-library/svelte";
import { ValueState } from "src/lib/processing/msf";
import { expect, test } from "vitest";
import FrameValue from "./FrameValue.svelte";

test.each([
  ValueState.Invalid,
  ValueState.Incomplete,
  ValueState.Complete,
  ValueState.Valid,
])("should display content for ValueState %s", (state: ValueState) => {
  const result = render(FrameValue, {
    value: { val: "DEADBEEF", bitCount: 0, state },
  });

  expect(result.container).toHaveTextContent("DEADBEEF");
});

test("should display padded fallback character for Unset ValueState", () => {
  const result = render(FrameValue, {
    value: { val: "DEADBEEF", bitCount: 0, state: ValueState.Unset },
    fallbackChar: "!",
    padWidth: 10,
  });

  expect(result.container).toHaveTextContent("!!!!!!!!!!");
});

test("should have configurable pad width and character", () => {
  const result = render(FrameValue, {
    value: { val: "DEADBEEF", bitCount: 0, state: ValueState.Complete },
    padChar: "+",
    padWidth: 9,
  });

  expect(result.container).toHaveTextContent("+DEADBEEF");
});
