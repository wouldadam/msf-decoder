import { render } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import Settings from "./Settings.svelte";

test("can switch between basic and advanced settings", async () => {
  const user = userEvent.setup();
  const result = render(Settings);

  const basicBtn = result.getByText("Basic");
  const advancedBtn = result.getByText("Advanced");

  await user.click(basicBtn);
  expect(await result.findByText("Carrier frequency")).not.toBeNull();

  await user.click(advancedBtn);
  expect(await result.findByText("FFT size")).not.toBeNull();
});
