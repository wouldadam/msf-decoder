import { beforeEach, vi, type Mock } from "vitest";

// Mocks for the web audio API worker thread
class MessagePort {
  postMessage = vi.fn();

  start = vi.fn();
  close = vi.fn();

  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();

  onmessage = vi.fn();
  onmessageerror = vi.fn();

  constructor() {}
}

class AudioWorkletProcessor {
  port: MessagePort = new MessagePort();

  constructor() {}
}

class AudioWorkletNode {
  port: MessagePort = new MessagePort();

  parameters: AudioParamMap = new Map();
  channelCount: number = 1;
  channelCountMode: ChannelCountMode = "explicit";
  channelInterpretation: ChannelInterpretation = "discrete";
  context: BaseAudioContext = null;
  numberOfInputs: number = 1;
  numberOfOutputs: number = 1;

  connect = vi.fn();
  disconnect = vi.fn();

  dispatchEvent = vi.fn();
  onprocessorerror = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();

  constructor() {}
}

global.AudioWorkletProcessor = AudioWorkletProcessor;
global.AudioWorkletNode = AudioWorkletNode;
global.registerProcessor = vi.fn();

beforeEach(() => {
  global.currentTime = 0;
  global.sampleRate = 48000;
  (global.registerProcessor as Mock).mockReset();
});
