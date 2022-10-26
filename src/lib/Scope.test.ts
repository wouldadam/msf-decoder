import { render, waitFor } from "@testing-library/svelte";
import { defaultProcessor } from "./Processor";
import Scope from "./Scope.svelte";

beforeEach(() => {
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    setTimeout(() => cb(1), 0);
    return 0;
  });
});

test("should render with no analyser", async () => {
  const result = render(Scope);

  const canvas = result.getByTestId("scope-canvas") as HTMLCanvasElement;
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
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispatchEvent: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getFloatFrequencyData: jest.fn(),
    getByteFrequencyData: jest.fn(),
    getFloatTimeDomainData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
  };
  const result = render(Scope);

  const canvas = result.getByTestId("scope-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");

  waitFor(() => expect(ctx.stroke).toBeCalled());
  waitFor(() =>
    expect(defaultProcessor.analyser.getByteTimeDomainData).toBeCalled()
  );
});
