import { render, waitFor } from "@testing-library/svelte";
import { beforeEach, test, vi } from "vitest";
import { defaultProcessor } from "./Processor";
import Scan from "./Scan.svelte";

beforeEach(() => {
  window.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
    setTimeout(() => cb(1), 0);
    return 0;
  });
});

test("should render with no analyser", async () => {
  const result = render(Scan);

  const canvas = result.getByTestId("chart-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");

  waitFor(() => expect(ctx.stroke).toBeCalled());
});

test("should render with a MediaDevice", async () => {
  defaultProcessor.analyser = {
    fftSize: 1024,
    frequencyBinCount: 512,
    minDecibels: 0,
    maxDecibels: 10,
    smoothingTimeConstant: 0,
    channelCount: 1,
    channelCountMode: "explicit",
    channelInterpretation: "discrete",
    numberOfInputs: 1,
    numberOfOutputs: 1,
    context: null,
    connect: vi.fn() as any,
    disconnect: vi.fn() as any,
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getFloatFrequencyData: vi.fn(),
    getByteFrequencyData: vi.fn(),
    getFloatTimeDomainData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
  };
  const result = render(Scan);

  const canvas = result.getByTestId("chart-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");

  waitFor(() => expect(ctx.stroke).toBeCalled());
  waitFor(() =>
    expect(defaultProcessor.analyser.getByteFrequencyData).toBeCalled()
  );
});
