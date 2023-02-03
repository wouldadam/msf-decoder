import type { ComparatorOptions } from "./ComparatorNode";

const comparatorProcessorName = "comparator-processor";

interface ComparatorProcessorOptions extends AudioWorkletNodeOptions {
  processorOptions: ComparatorOptions;
}

/**
 * Turns audio samples into zeros and ones based on a threshold.
 */
export class ComparatorProcessor extends AudioWorkletProcessor {
  private on = 1;
  private off = 0;

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
    _parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0][0];
    const output = outputs[0][0];

    for (let sampleIdx = 0; sampleIdx < input.length; ++sampleIdx) {
      let sample = input[sampleIdx];
      let bit = this.off;

      if (sample > this.options.processorOptions.threshold) {
        bit = this.on;
      }

      output[sampleIdx] = bit;
    }
    return true;
  }
}

registerProcessor(comparatorProcessorName, ComparatorProcessor);
