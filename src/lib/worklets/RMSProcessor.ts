import type { RMSOptions } from "./RMSNode";

const rmsProcessorName = "rms-processor";

interface RMSProcessorOptions extends AudioWorkletNodeOptions {
  processorOptions: RMSOptions;
}

/**
 * Calculates RMS of input samples.
 */
export class RMSProcessor extends AudioWorkletProcessor {
  private avg;
  private beta;

  constructor(private options: RMSProcessorOptions) {
    super();

    this.avg = 0;
    this.beta = 1 - this.options.processorOptions.alpha;
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0][0];
    const output = outputs[0][0];

    for (let sampleIdx = 0; sampleIdx < input.length; ++sampleIdx) {
      const magSquared = input[sampleIdx] * input[sampleIdx];
      this.avg =
        this.beta * this.avg + this.options.processorOptions.alpha * magSquared;
      output[sampleIdx] = Math.sqrt(this.avg);
    }

    return true;
  }
}

registerProcessor(rmsProcessorName, RMSProcessor);
