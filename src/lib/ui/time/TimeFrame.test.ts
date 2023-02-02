import { render } from "@testing-library/svelte";
import { CreateTimeFrame, DayOfWeek, ValueState } from "src/lib/processing/msf";
import { expect, test } from "vitest";
import TimeFrame from "./TimeFrame.svelte";

test("can display a fully unset TimeFrame", () => {
  const frame = CreateTimeFrame();

  const result = render(TimeFrame, {
    frame,
  });

  // Date
  expect(result.container).toHaveTextContent("-- / -- / -- -");

  // Time
  expect(result.container).toHaveTextContent("-- : --");

  // Flags
  expect(result.container).toHaveTextContent("DUT1 -");
  expect(result.container).toHaveTextContent("BST warn -");
  expect(result.container).toHaveTextContent("BST -");
});

test("can display a fully set TimeFrame", () => {
  let frame = CreateTimeFrame();
  const second = 43;

  frame.hour.val = 22;
  frame.hour.state = ValueState.Complete;
  frame.minute.val = 11;
  frame.minute.state = ValueState.Complete;

  frame.dayOfMonth.val = 15;
  frame.dayOfMonth.state = ValueState.Complete;
  frame.month.val = 11;
  frame.month.state = ValueState.Complete;
  frame.year.val = 25;
  frame.year.state = ValueState.Complete;
  frame.dayOfWeek.val = DayOfWeek.Sunday;
  frame.dayOfWeek.state = ValueState.Complete;

  frame.dut1.val = 0.5;
  frame.dut1.state = ValueState.Complete;
  frame.summerTimeWarning.val = true;
  frame.summerTimeWarning.state = ValueState.Complete;
  frame.summerTime.val = true;
  frame.summerTime.state = ValueState.Complete;

  const result = render(TimeFrame, {
    frame,
    second,
  });

  // Date
  expect(result.container).toHaveTextContent(
    `${frame.year.val} / ${frame.month.val} / ${frame.dayOfMonth.val} ${
      Object.values(DayOfWeek)[frame.dayOfWeek.val]
    }`
  );

  // Time
  expect(result.container).toHaveTextContent(
    `${frame.hour.val} : ${frame.minute.val} : ${second}`
  );

  // Flags
  expect(result.container).toHaveTextContent(`DUT1 ${frame.dut1.val}`);
  expect(result.container).toHaveTextContent("BST warn ✓");
  expect(result.container).toHaveTextContent("BST ✓");
});
