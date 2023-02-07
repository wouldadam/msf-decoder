const rmsProcessorName = "rms-processor";

/**
 * Calculates the RMS (root mean square)
 */
export class RMSNode extends AudioWorkletNode {
  constructor(context: BaseAudioContext) {
    super(context, rmsProcessorName, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
      channelCountMode: "explicit",
      channelInterpretation: "discrete",
      outputChannelCount: [1],
    });
  }
}
