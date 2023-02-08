import { render } from "@testing-library/svelte";
import { test } from "vitest";
import FrameValueLegend from "./FrameValueLegend.svelte";

test("displays legend", async () => {
  const result = render(FrameValueLegend);
  expect(result.container).not.toBeNull();
});
