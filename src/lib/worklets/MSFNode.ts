import type { Writable } from "svelte/store";
import {
  CreateTimeFrame,
  ValueState,
  type FrameValue,
  type TimeFrame,
} from "../processing/msf";
import { maxEvents, type EventStore, type TimeStore } from "../time";

const msfProcessorName = "msf-processor";

export interface MSFOptions {
  symbolRate: number;
}

/// A minute marker has been found
export interface MinuteMark {
  msg: "minute";

  /// The time at the audio source
  audioTime: number;

  /// The utc time
  utcTime: number;
}

/// A valid second has been found
export interface SecondMark {
  msg: "second";

  /// The time at the audio source
  audioTime: number;

  /// The utc time
  utcTime: number;

  /// 0 to 59
  second: number;

  /// The TimeFrame decoded up to this point
  frame: TimeFrame;
}

/// An invalid segment has been found
export interface InvalidMark {
  msg: "invalid";

  /// The time at the audio source
  audioTime: number;

  /// The utc time
  utcTime: number;

  /// Why the segment is invalid
  reason: string;

  /// The invalid bits
  bits: string;

  /// 0 to 59
  second: number;

  /// The TimeFrame decoded up to this point
  frame: TimeFrame;
}

export interface SyncMark {
  msg: "sync";

  /// The time at the audio source
  audioTime: number;

  /// The utc time
  utcTime: number;

  /// The number of samples skipped
  skipSamples: number;

  /// The max count of the same skipped to
  maxCount: number;
}

export type MSFMsg = MinuteMark | SecondMark | InvalidMark | SyncMark;

export class MSFNode extends AudioWorkletNode {
  constructor(
    context: BaseAudioContext,
    options: MSFOptions,
    private timeStore: Writable<TimeStore>,
    private eventStore: Writable<EventStore>
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
      this.timeStore.update((store) => {
        return {
          currentTime: this.merge(store.currentTime, store.currentFrame),
          previousFrame: store.currentFrame,
          currentFrame: CreateTimeFrame(),
          second: 0,
        };
      });
    } else if (ev.data.msg === "second") {
      const mark: SecondMark = ev.data;
      this.timeStore.update((store) => {
        return {
          currentTime: store.currentTime,
          previousFrame: store.previousFrame,
          currentFrame: mark.frame,
          second: mark.second,
        };
      });
    } else if (ev.data.msg === "invalid") {
      const mark: InvalidMark = ev.data;
      this.timeStore.update((store) => {
        return {
          currentTime: store.currentTime,
          previousFrame: store.currentFrame,
          currentFrame: CreateTimeFrame(),
          second: null,
        };
      });
    }

    this.addEvent(ev.data);
  };

  private merge(currentTime: TimeFrame, newFrame: TimeFrame): TimeFrame {
    const newTime = {
      ...currentTime,
    };

    for (const key of Object.keys(newFrame)) {
      const val = newFrame[key] as FrameValue<any>;
      if (val.state === ValueState.Valid) {
        newTime[key] = val;
      }
    }

    return newTime;
  }

  private addEvent(event: MSFMsg) {
    this.eventStore.update((store) => {
      const events = [event, ...store.events];
      events.length = Math.min(events.length, maxEvents);

      return {
        events,
      };
    });
  }
}
