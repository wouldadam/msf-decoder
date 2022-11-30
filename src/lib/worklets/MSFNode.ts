import type { Writable } from "svelte/store";
import {
  CreateTimeFrame,
  ValueState,
  type FrameValue,
  type TimeFrame,
} from "../processing/msf";
import type { TimeStore } from "../time";

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

export type MSFMsg = MinuteMark | SecondMark | InvalidMark;

export class MSFNode extends AudioWorkletNode {
  constructor(
    context: BaseAudioContext,
    options: MSFOptions,
    private store: Writable<TimeStore>
  ) {
    super(context, msfProcessorName, {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: 1,
      channelCountMode: "explicit",
      channelInterpretation: "discrete",
      outputChannelCount: [],
      processorOptions: options,
    });

    this.port.onmessage = this.onMessage;
  }

  private onMessage = (ev: MessageEvent<MSFMsg>) => {
    if (ev.data.msg === "minute") {
      this.store.update((store) => {
        return {
          currentTime: this.merge(store.currentTime, store.currentFrame),
          previousFrame: store.currentFrame,
          currentFrame: CreateTimeFrame(),
          second: 0,
        };
      });
    } else if (ev.data.msg === "second") {
      const mark: SecondMark = ev.data;
      this.store.update((store) => {
        return {
          currentTime: store.currentTime,
          previousFrame: store.previousFrame,
          currentFrame: mark.frame,
          second: mark.second,
        };
      });
    } else if (ev.data.msg === "invalid") {
      this.store.update((store) => {
        return {
          currentTime: store.currentTime,
          previousFrame: store.currentFrame,
          currentFrame: CreateTimeFrame(),
          second: null,
        };
      });
    }
  };

  private merge(currentTime: TimeFrame, newFrame: TimeFrame): TimeFrame {
    const newTime = {
      ...currentTime,
    };

    for (const key of Object.keys(newFrame)) {
      console.log(key);
      const val = newFrame[key] as FrameValue<any>;
      if (val.state === ValueState.Valid) {
        newTime[key] = val;
      }
    }

    return newTime;
  }
}
