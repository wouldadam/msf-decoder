const comparatorProcessorName = "comparator-processor";
export const negativePolarityFlag = 0;
export const positivePolarityFlag = 1;

/**
 * A comparator node only turns a single channel into 0/1's based on
 * a dynamically changing threshold.
 */
export class ComparatorNode extends AudioWorkletNode {
  constructor(context: BaseAudioContext) {
    super(context, comparatorProcessorName, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
      channelCountMode: "explicit",
      channelInterpretation: "discrete",
      outputChannelCount: [1],
    });
  }
}
