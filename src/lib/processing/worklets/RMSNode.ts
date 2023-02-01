const rmsProcessorName = "rms-processor";

export interface RMSOptions {
  /// Contribution of the current sample vs previous samples
  alpha: number;
}

/**
 * Calculates the RMS (root mean square)
 */
export class RMSNode extends AudioWorkletNode {
  constructor(context: BaseAudioContext, options: RMSOptions) {
    super(context, rmsProcessorName, {
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
