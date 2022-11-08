import type { ComparatorOptions } from "./ComparatorNode";

const comparatorProcessorName = "comparator-processor";

interface ComparatorProcessorOptions extends AudioWorkletNodeOptions {
  processorOptions: ComparatorOptions;
}

/**
 * Turns audio samples into zeros and ones based on a dynamic threshold.
 */
export class ComparatorProcessor extends AudioWorkletProcessor {
  private on = 1;
  private off = 0;

  private sampleMin = Number.MAX_VALUE;
  private sampleMax = Number.MIN_VALUE;

  private lastThresholdUpdateSec = Number.MIN_VALUE;
  private threshold = 0;

  constructor(private options: ComparatorProcessorOptions) {
    super();

    if (this.options.processorOptions.polarity === "positive") {
      this.on = 1;
      this.off = 0;
    } else {
      this.on = 0;
      this.off = 1;
    }
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    if (currentTime - this.lastThresholdUpdateSec) {
      this.threshold = (this.sampleMax + this.sampleMin) / 2;
      this.sampleMin = Number.MAX_VALUE;
      this.sampleMax = Number.MIN_VALUE;
      this.lastThresholdUpdateSec = currentTime;
    }
    const input = inputs[0][0];
    const output = outputs[0][0];

    for (let sampleIdx = 0; sampleIdx < input.length; ++sampleIdx) {
      let sample = this.off;
      if (input[sampleIdx] > this.threshold) {
        sample = this.on;
      }

      output[sampleIdx] = sample;

      this.sampleMin = Math.min(input[sampleIdx], this.sampleMin);
      this.sampleMax = Math.max(input[sampleIdx], this.sampleMax);
    }

    return true;
  }
}

registerProcessor(comparatorProcessorName, ComparatorProcessor);
