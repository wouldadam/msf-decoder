const comparatorProcessorName = "comparator-processor";

export interface ComparatorOptions {
  /// Should high or low samples be considered a 1.
  polarity: "positive" | "negative";

  /// Over what time period should the dynamic threshold look.
  thresholdWindowSec: number;
}

/**
 * A comparator node only turns a single channel into 0/1's based on
 * a dynamically changing threshold.
 */
export class ComparatorNode extends AudioWorkletNode {
  constructor(context: BaseAudioContext, options: ComparatorOptions) {
    super(context, comparatorProcessorName, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
      channelCountMode: "explicit",
      channelInterpretation: "discrete",
      outputChannelCount: [1],
      processorOptions: options,
    });
  }
}
