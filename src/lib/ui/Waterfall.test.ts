import { render, waitFor } from "@testing-library/svelte";
import { beforeEach, test, vi } from "vitest";
import { defaultProcessorKey } from "../processing/Processor";
import ContextParent from "./ContextParent.svelte";
import Waterfall from "./Waterfall.svelte";

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
test("should render with no analyser", async () => {
  const result = render(Waterfall);

  const canvas = result.getByTestId("waterfall-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");

  vi.advanceTimersByTime(10000);

  await waitFor(() => expect(ctx.stroke).toBeCalled());
});

test("should render with a MediaDevice", async () => {
  const processor = {
    analyser: {
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
      context: {
        sampleRate: 48000,
      },
      connect: vi.fn() as any,
      disconnect: vi.fn() as any,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getFloatFrequencyData: vi.fn(),
      getByteFrequencyData: vi.fn(),
      getFloatTimeDomainData: vi.fn(),
      getByteTimeDomainData: vi.fn(),
    },
  };

  const result = render(ContextParent, {
    props: {
      contextKey: defaultProcessorKey,
      contextValue: processor,
      child: Waterfall,
    },
  });

  const canvas = result.getByTestId("waterfall-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");

  vi.advanceTimersByTime(10000);

  await waitFor(() => expect(ctx.stroke).toBeCalled());
  await waitFor(() =>
    expect(processor.analyser.getByteFrequencyData).toBeCalled()
  );
});
