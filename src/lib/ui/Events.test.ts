import { render } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { CreateTimeFrame } from "../processing/msf";
import { eventStore } from "../time";
import Events from "./Events.svelte";

test("should render when no events", () => {
  eventStore.set({
    events: [],
  });

  const result = render(Events);

  expect(result.container).toHaveTextContent("Waiting for events...");
});

test("should render all event types", () => {
  eventStore.set({
    events: [
      { msg: "minute", audioTime: 1, utcTime: 1 },
      {
        msg: "second",
        audioTime: 2,
        utcTime: 2,
        second: 2,
        frame: CreateTimeFrame(),
      },
      {
        msg: "invalid",
        audioTime: 3,
        utcTime: 3,
        second: 3,
        bits: "000",
        reason: "Test error.",
        frame: CreateTimeFrame(),
      },
      {
        msg: "sync",
        audioTime: 4,
        utcTime: 4,
        maxCount: 4,
        skipSamples: 4,
      },
    ],
  });

  const result = render(Events);

  expect(result.container).toHaveTextContent("[1] Found minute marker.");
  expect(result.container).toHaveTextContent("[2] Valid second (2).");
  expect(result.container).toHaveTextContent(
    "[3] Invalid segment (3): Test error."
  );

  expect(result.container).toHaveTextContent("[4] Synced by 4 samples.");
});

test("shows event detail in modal", async () => {
  eventStore.set({
    events: [
      { msg: "minute", audioTime: 1, utcTime: 1 },
      {
        msg: "second",
        audioTime: 2,
        utcTime: 2,
        second: 2,
        frame: CreateTimeFrame(),
      },
      {
        msg: "invalid",
        audioTime: 3,
        utcTime: 3,
        second: 3,
        bits: "000",
        reason: "Test error.",
        frame: CreateTimeFrame(),
      },
      {
        msg: "sync",
        audioTime: 4,
        utcTime: 4,
        maxCount: 4,
        skipSamples: 4,
      },
    ],
  });

  const user = userEvent.setup();
  const result = render(Events);

  for (let buttonTxt of ["[1]", "[2]", "[3]", "[4]"]) {
    const button = await result.findByText(buttonTxt);
    const modal = await result.findByRole("dialog");
    const close = await result.findByText("Close");

    expect(modal.className).not.toContain("modal-open");

    await user.click(button);

    expect(modal.className).toContain("modal-open");

    await user.click(close);

    expect(modal.className).not.toContain("modal-open");
  }
});
