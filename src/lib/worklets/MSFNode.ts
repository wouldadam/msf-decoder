import type { TimeFrame } from "../processing/msf";

const msfProcessorName = "msf-processor";

export interface MSFOptions {
  symbolRate: number;
}

export interface MinuteMark {
  msg: "minute";

  audioTime: number;
}

export interface SecondMark {
  msg: "second";

  audioTime: number;

  /// 0 to 59
  second: number;

  /// The TimeFrame decoded up to this point
  frame: TimeFrame;
}

export interface InvalidMark {
  msg: "invalid";

  audioTime: number;

  reason: string;

  /// 0 to 59
  second: number;

  /// The TimeFrame decoded up to this point
  frame: TimeFrame;
}

export type MSFMsg = MinuteMark | SecondMark;

export class MSFNode extends AudioWorkletNode {
  constructor(context: BaseAudioContext, options: MSFOptions) {
    super(context, msfProcessorName, {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: 1,
      channelCountMode: "explicit",
      channelInterpretation: "discrete",
      outputChannelCount: [],
      processorOptions: options,
    });
  }
}
