import {
  isMinuteSegment,
  isSecondSegment,
  minuteSegment,
  parseSecond,
  secondSegment,
  validateFixedBits,
  type TimeFrame,
} from "../processing/msf";
import { RingBuffer } from "../processing/RingBuffer";
import type {
  InvalidMark,
  MinuteMark,
  MSFOptions,
  SecondMark,
} from "./MSFNode";

const msfProcessorName = "msf-processor";

interface MSFProcessorOptions extends AudioWorkletNodeOptions {
  processorOptions: MSFOptions;
}

/**
 * Demodulates on/off keyed audio data.
 * Outputs samples are 0 or 1.
 * Excess output samples are set to -1.
 */
export class MSFProcessor extends AudioWorkletProcessor {
  private samplesPerSymbol: number;

  private inputBuffer: RingBuffer; /// Raw input samples
  private demodBuffer: Float32Array; /// Tmp buffer for processing input samples
  private symbolBuffer: RingBuffer; /// Demodulated bits into symbols

  private syncBuffer: Float32Array;

  private isFrameStarted: boolean; /// Are we currently processing a frame
  private currentSecond: number; /// What second are we on

  private currentFrame: TimeFrame; /// The currently decoded TimeFrame

  private once = false;

  constructor(options: MSFProcessorOptions) {
    super();

    this.samplesPerSymbol = sampleRate / options.processorOptions.symbolRate;

    this.inputBuffer = new RingBuffer(65 * this.samplesPerSymbol);
    this.demodBuffer = new Float32Array(this.samplesPerSymbol);
    this.symbolBuffer = new RingBuffer(2 * 60);

    this.syncBuffer = new Float32Array(this.samplesPerSymbol);

    this.isFrameStarted = false;
    this.currentSecond = -1;
    this.currentFrame = {};
  }

  /// Start processing a frame
  private startFrame() {
    this.isFrameStarted = true;
    this.currentSecond = 0;
  }

  /// Stop processing a frame
  private endFrame() {
    this.isFrameStarted = false;
    this.currentSecond = -1;
    this.currentFrame = {};
  }

  /// Handle an invalid frame, ends frame processing
  private invalidSegment(reason: string) {
    // Notify the node
    const mark: InvalidMark = {
      msg: "invalid",
      audioTime: currentTime,
      reason,
      second: this.currentSecond + 1,
      frame: {},
    };
    this.port.postMessage(mark);

    // Give in and start searching for the next frame
    this.endFrame();
  }

  // Process the start of the symbol buffer as if it is a second
  private processSecond() {
    if (!validateFixedBits(this.symbolBuffer, this.currentSecond)) {
      this.invalidSegment("invalid fixed bits");
      return;
    }

    // Parse it
    const frameUpdate = parseSecond(
      this.symbolBuffer,
      this.currentSecond,
      this.currentFrame
    );

    if (frameUpdate instanceof Error) {
      this.invalidSegment(frameUpdate.message);
    } else {
      this.currentFrame = { ...this.currentFrame, ...frameUpdate };
    }

    // Notify the node
    const mark: SecondMark = {
      msg: "second",
      audioTime: currentTime,
      second: this.currentSecond,
      frame: this.currentFrame,
    };
    this.port.postMessage(mark);

    // End of the current minute
    if (this.currentSecond >= 59) {
      this.endFrame();
    }
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    // Store samples until we have enough to process
    this.inputBuffer.push(inputs[0][0]);

    // If we have enough input, Demod into output buffer
    while (this.inputBuffer.length >= this.samplesPerSymbol) {
      this.inputBuffer.pull(this.demodBuffer);
      const sum = this.demodBuffer.reduce((sum, val) => sum + val, 0);

      if (sum > this.samplesPerSymbol / 2) {
        this.symbolBuffer.push([1]);
      } else {
        this.symbolBuffer.push([0]);
      }
    }

    // If we have enough symbols try to parse them
    while (this.symbolBuffer.length >= minuteSegment.length) {
      if (this.isFrameStarted) {
        if (isSecondSegment(this.symbolBuffer)) {
          // We found a second segment
          this.currentSecond += 1;

          // Process the second
          this.processSecond();

          // Remove the segment from the buffer
          this.symbolBuffer.skip(secondSegment.length);
        } else {
          // We found invalid data inside a frame
          this.invalidSegment("segment contains invalid data");
        }
      } else if (isMinuteSegment(this.symbolBuffer)) {
        // We found a minute segment
        this.startFrame();

        // Notify the Node
        const mark: MinuteMark = { msg: "minute", audioTime: currentTime };
        this.port.postMessage(mark);

        // Remove the segment from the buffer
        this.symbolBuffer.skip(minuteSegment.length);
      } else {
        this.symbolBuffer.skip(1);
      }
    }

    return true;
  }
}

registerProcessor(msfProcessorName, MSFProcessor);
