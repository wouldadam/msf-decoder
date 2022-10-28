import { render, waitFor } from "@testing-library/svelte";
import { beforeEach, expect, test, vi } from "vitest";
import Chart from "./Chart.svelte";

beforeEach(() => {
  window.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
    setTimeout(() => cb(1), 0);
    return 0;
  });
});

test("should render with no props", async () => {
  const result = render(Chart);

  const canvas = result.getByTestId("chart-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");

  waitFor(() => expect(ctx.stroke).toBeCalled());
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
    },
    yAxis: {
      label: "y-label",
      minLabel: "y-min-label",
      maxLabel: "y-max-label",
    },
  });

  const canvas = result.getByTestId("chart-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");

  waitFor(() => expect(ctx.stroke).toBeCalled());
  waitFor(() => expect(drawLine).toBeCalled());

  for (const dimension of ["x", "y"]) {
    expect(result.getByText(`${dimension}-label`)).toBeInTheDocument();
    expect(result.getByText(`${dimension}-min-label`)).toBeInTheDocument();
    expect(result.getByText(`${dimension}-max-label`)).toBeInTheDocument();
  }
});
