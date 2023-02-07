import { render } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { get } from "svelte/store";
import { expect, test } from "vitest";
import { carrierFrequencyHz, displayMode } from "../../config";
import Settings from "./Settings.svelte";

test("should show current carrier frequency", () => {
  const result = render(Settings);

  expect(result.getByRole("spinbutton")).toHaveValue(get(carrierFrequencyHz));
});

test("should set carrier frequency", async () => {
  const user = userEvent.setup();
  const result = render(Settings);

  const input = result.getByRole("spinbutton");
  await user.clear(input);
  await user.type(input, "3579");

  expect(result.getByRole("spinbutton")).toHaveValue(3579);
  expect(get(carrierFrequencyHz)).toBe(3579);
});

test("can set display mode", async () => {
  const user = userEvent.setup();
  const result = render(Settings);

  const buttons = result.getAllByRole("button");
  const rms = buttons.find(
    (btn) => btn.getAttribute("data-tip") === "RMS view"
  );
  expect(rms).not.toBeNull();

  await user.click(rms);
  expect(get(displayMode)).toBe("rms");
});
