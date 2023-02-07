import { render } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import AdvancedSettings from "./AdvancedSettings.svelte";

test.each([
  ["Analyser", "FFT size"],
  ["Filter", "Q-value"],
])("can show %s settings", async (label: string, expected: string) => {
    const user = userEvent.setup();
    const result = render(AdvancedSettings);

    const tabBtn = result.getByText(label);

    await user.click(tabBtn);
    expect(await result.findByText(expected)).not.toBeNull();
});
