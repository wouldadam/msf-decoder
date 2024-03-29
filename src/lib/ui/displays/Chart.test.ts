import { render, waitFor } from "@testing-library/svelte";
import { beforeEach, expect, test, vi } from "vitest";
import Chart from "./Chart.svelte";

beforeEach(() => {
  vi.useFakeTimers();

  window.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
    setTimeout(() => cb(10000), 10000);
    return 0;
  });
});

afterEach(() => {
  vi.clearAllTimers();
});

test("should render with no props", async () => {
  const result = render(Chart);

  const canvas = result.getByTestId("chart-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");

  vi.advanceTimersByTime(10000);

  await waitFor(() => expect(ctx.stroke).toBeCalled());

  expect(result.container).toHaveTextContent("X");
  expect(result.container).toHaveTextContent("Y");
});

test("should render with props", async () => {
  const drawLine = vi.fn();
  const result = render(Chart, {
    drawLine,
    targetFps: 10,
    xAxis: {
      label: "x-label",
      minLabel: "x-min-label",
      maxLabel: "x-max-label",
      position: "side",
    },
    yAxis: {
      label: "y-label",
      minLabel: "y-min-label",
      maxLabel: "y-max-label",
      position: "side",
    },
  });

  const canvas = result.getByTestId("chart-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");

  vi.advanceTimersByTime(10000);

  await waitFor(() => expect(ctx.stroke).toBeCalled());
  await waitFor(() => expect(drawLine).toBeCalled());

  for (const dimension of ["x", "y"]) {
    expect(result.getByText(`${dimension}-label`)).toBeInTheDocument();
    expect(result.getByText(`${dimension}-min-label`)).toBeInTheDocument();
    expect(result.getByText(`${dimension}-max-label`)).toBeInTheDocument();
  }
});
