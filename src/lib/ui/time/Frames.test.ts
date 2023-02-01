import { render } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { CreateTimeFrame, DayOfWeek, ValueState } from "../../processing/msf";
import { timeStore } from "../../time";
import Frames from "./Frames.svelte";

test("can display current and previous frames", async () => {
  let currentFrame = CreateTimeFrame();
  currentFrame.dayOfWeek.val = DayOfWeek.Monday;
  currentFrame.dayOfWeek.state = ValueState.Complete;

  let previousFrame = CreateTimeFrame();
  previousFrame.dayOfWeek.val = DayOfWeek.Friday;
  previousFrame.dayOfWeek.state = ValueState.Complete;

  timeStore.set({
    currentFrame,
    previousFrame,
    currentTime: CreateTimeFrame(),
    second: 0,
  });

  const user = userEvent.setup();
  const result = render(Frames);

  const currentBtn = await result.findByText("Current");
  const previousBtn = await result.findByText("Previous");

  expect(result.container).toHaveTextContent("Monday");

  await user.click(previousBtn);

  expect(result.container).toHaveTextContent("Friday");

  await user.click(currentBtn);

  expect(result.container).toHaveTextContent("Monday");
});
