import { render } from "@testing-library/svelte";
import { CreateTimeFrame, ValueState } from "src/lib/processing/msf";
import { timeStore } from "src/lib/time";
import { expect, test } from "vitest";
import Time from "./Time.svelte";

test("can display current time", () => {
  const second = 27;
  const currentTime = CreateTimeFrame();
  currentTime.hour.val = 21;
  currentTime.hour.state = ValueState.Complete;
  currentTime.minute.val = 36;
  currentTime.minute.state = ValueState.Complete;

  timeStore.update((store) => {
    return {
      ...store,
      currentTime,
      second,
    };
  });

  const result = render(Time);

  expect(result.container).toHaveTextContent(
    `${currentTime.hour.val} : ${currentTime.minute.val} : ${second}`
  );
});
