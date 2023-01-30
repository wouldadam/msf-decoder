import {
  CreateTimeFrame,
  isMinuteSegment,
  isSecondSegment,
  minuteSegment,
  parseSecond,
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
const symbolsPerSegment = minuteSegment.length;
const maxSegments = 5;

interface MSFProcessorOptions extends AudioWorkletNodeOptions {
  processorOptions: MSFOptions;
}

/// Put the first 10 elements (or max) in a string
function first10(buffer: RingBuffer) {
  let result = "";
  for (let idx = 0; idx < Math.min(10, buffer.length); ++idx) {
    result += buffer.at(idx).toString();
  }

  return result;
}

/**
 * Demodulates on/off keyed audio data.
 * Outputs samples are 0 or 1.
 * Excess output samples are set to -1.
 */
export class MSFProcessor extends AudioWorkletProcessor {
  private samplesPerSymbol: number;
  private samplesPerSegment: number;

  private inputRing: RingBuffer; /// Raw input samples
  private syncBuffer: Float32Array; /// Tmp buffer for time sync
  private syncedRing: RingBuffer; /// Synced input samples
  private demodBuffer: Float32Array; /// Tmp buffer for processing input samples
  private symbolRing: RingBuffer; /// Demodulated bits into symbols

  private isFrameStarted: boolean; /// Are we currently processing a frame
  private currentSecond: number; /// What second are we on

  private currentFrame: TimeFrame; /// The currently decoded TimeFrame

  constructor(options: MSFProcessorOptions) {
    super();

    this.samplesPerSymbol = sampleRate / options.processorOptions.symbolRate;
    this.samplesPerSegment = this.samplesPerSymbol * symbolsPerSegment;

    this.inputRing = new RingBuffer(maxSegments * this.samplesPerSegment);
    this.syncBuffer = new Float32Array(this.samplesPerSegment);
    this.syncedRing = new RingBuffer(maxSegments * this.samplesPerSegment);
    this.demodBuffer = new Float32Array(this.samplesPerSymbol); // Always take 1 full symbol
    this.symbolRing = new RingBuffer((maxSegments + 1) * symbolsPerSegment);

    this.isFrameStarted = false;
    this.currentSecond = -1;
    this.currentFrame = CreateTimeFrame();
  }

  process(
    inputs: Float32Array[][],
    _outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    // Store the input for later processing
    this.storeInput(inputs[0][0]);

    // Process the input, performing any synchronization
    this.processInput();

    // Turn the samples into symbols
    this.processSamples();

    // Process any available symbols into segments
    this.processSymbols();

    return true;
  }

  /// Store samples until we have enough to process
  private storeInput(input: Float32Array) {
    if (this.inputRing.length > this.inputRing.capacity - 128) {
      console.error("Input buffer full");
    }
    this.inputRing.push(input);
  }

  /// Synchronize stored samples across segments
  private processInput() {
    if (this.inputRing.length >= this.syncBuffer.length) {
      let syncMax = Number.MIN_VALUE;
      let syncMaxIdx = 0;

      // Only process full segments
      let fullSegmentSamplesCount =
        Math.floor(this.inputRing.length / this.samplesPerSegment) *
        this.samplesPerSegment;

      // Find the periodic max value, this should be where the segments start
      // as the first symbol is always 1, this isn't the case for any other symbol position.
      for (let sampIdx = 0; sampIdx < fullSegmentSamplesCount; ++sampIdx) {
        const syncIdx = sampIdx % this.syncBuffer.length;
        this.syncBuffer[syncIdx] += this.inputRing.at(sampIdx);

        if (this.syncBuffer[syncIdx] > syncMax) {
          syncMax = this.syncBuffer[syncIdx];
          syncMaxIdx = syncIdx;
        }
      }

      if (syncMaxIdx > 0 && syncMax > 0) {
        this.inputRing.skip(syncMaxIdx);
        this.syncBuffer.fill(0);

        // We might have fewer segments after skipping some samples
        fullSegmentSamplesCount =
          Math.floor(this.inputRing.length / this.samplesPerSegment) *
          this.samplesPerSegment;
      }

      // Copy full segments into syncedRing
      for (let idx = 0; idx < fullSegmentSamplesCount; ++idx) {
        this.syncedRing.push([this.inputRing.at(idx)]);
      }
      this.inputRing.skip(fullSegmentSamplesCount);
    }
  }

  /// Turn synced samples into symbols
  private processSamples() {
    while (this.syncedRing.length >= this.demodBuffer.length) {
      this.syncedRing.pull(this.demodBuffer);
      const sum = this.demodBuffer.reduce((sum, val) => sum + val, 0);

      if (this.symbolRing.length === this.symbolRing.capacity) {
        console.error("Symbol buffer full");
      }

      if (sum > this.demodBuffer.length / 2) {
        this.symbolRing.push([1]);
      } else {
        this.symbolRing.push([0]);
      }
    }
  }

  /// Process the symbols into full time frames
  private processSymbols() {
    // If we have enough symbols for a whole segment try to parse
    while (this.symbolRing.length >= symbolsPerSegment) {
      if (this.isFrameStarted) {
        this.currentSecond += 1;
        if (isSecondSegment(this.symbolRing)) {
          // We found a second segment, process it
          this.parseSecond();

          // Remove the segment from the buffer
          this.symbolRing.skip(symbolsPerSegment);
        } else {
          // We found invalid data inside a frame
          this.invalidSegment(
            "Segment has invalid data.",
            first10(this.symbolRing)
          );
        }
      } else if (isMinuteSegment(this.symbolRing)) {
        // We found a minute segment
        this.startFrame();

        // Notify the Node
        const mark: MinuteMark = {
          msg: "minute",
          audioTime: currentTime,
          utcTime: new Date().getTime(),
        };
        this.port.postMessage(mark);

        // Remove the segment from the buffer
        this.symbolRing.skip(symbolsPerSegment);
      } else {
        if (isSecondSegment(this.symbolRing)) {
          this.invalidSegment(
            "Segment outside a frame.",
            first10(this.symbolRing)
          );
        }

        this.symbolRing.skip(1);
      }
    }
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
    this.currentFrame = CreateTimeFrame();
  }

  /// Handle an invalid frame, ends frame processing
  private invalidSegment(reason: string, bits: string) {
    // Notify the node
    const mark: InvalidMark = {
      msg: "invalid",
      audioTime: currentTime,
      utcTime: new Date().getTime(),
      reason,
      bits,
      second: this.currentSecond + 1,
      frame: JSON.parse(JSON.stringify(this.currentFrame)),
    };
    this.port.postMessage(mark);

    // Give in and start searching for the next frame
    this.endFrame();
  }

  // Parses the start of the symbol ring as if it is a second
  private parseSecond() {
    if (!validateFixedBits(this.symbolRing, this.currentSecond)) {
      this.invalidSegment("Invalid fixed bits.", first10(this.symbolRing));
      return;
    }

    // Parse it
    const result = parseSecond(
      this.symbolRing,
      this.currentSecond,
      this.currentFrame
    );

    if (result instanceof Error) {
      this.invalidSegment(result.message, first10(this.symbolRing));
    }

    // Notify the node
    const mark: SecondMark = {
      msg: "second",
      audioTime: currentTime,
      utcTime: new Date().getTime(),
      second: this.currentSecond,
      frame: JSON.parse(JSON.stringify(this.currentFrame)),
    };
    this.port.postMessage(mark);

    // End of the current minute
    if (this.currentSecond >= 59) {
      this.endFrame();
    }
  }
}

registerProcessor(msfProcessorName, MSFProcessor);
