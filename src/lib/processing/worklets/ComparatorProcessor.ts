const comparatorProcessorName = "comparator-processor";
export const negativePolarityFlag = 0;
export const positivePolarityFlag = 1;

/**
 * Turns audio samples into zeros and ones based on a threshold.
 */
export class ComparatorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0][0];
    const output = outputs[0][0];

    const threshold = parameters["threshold"][0];
    const polarity = parameters["polarity"][0];

    for (let sampleIdx = 0; sampleIdx < input.length; ++sampleIdx) {
      let sample = input[sampleIdx];
      let bit = 0;

      if (
        (polarity === positivePolarityFlag && sample > threshold) ||
        (polarity === negativePolarityFlag && sample < threshold)
      ) {
        bit = 1;
      }

      output[sampleIdx] = bit;
    }
    return true;
  }

  static get parameterDescriptors() {
    return [
      { name: "threshold", defaultValue: 0.05, minValue: 0, maxValue: 1 },
      { name: "polarity", defaultValue: 0, minValue: 0, maxValue: 1 },
    ];
  }
}

registerProcessor(comparatorProcessorName, ComparatorProcessor);
