const rmsProcessorName = "rms-processor";

/**
 * Calculates RMS of input samples.
 */
export class RMSProcessor extends AudioWorkletProcessor {
  private avg: number;

  constructor() {
    super();

    this.avg = 0;
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0][0];
    const output = outputs[0][0];
    const alpha = parameters["alpha"][0];
    const beta = 1 - alpha;

    for (let sampleIdx = 0; sampleIdx < input.length; ++sampleIdx) {
      const magSquared = input[sampleIdx] * input[sampleIdx];
      this.avg = beta * this.avg + alpha * magSquared;
      output[sampleIdx] = Math.sqrt(this.avg);
    }

    return true;
  }

  static get parameterDescriptors() {
    return [{ name: "alpha", defaultValue: 0.15, minValue: 0, maxValue: 1 }];
  }
}

registerProcessor(rmsProcessorName, RMSProcessor);
