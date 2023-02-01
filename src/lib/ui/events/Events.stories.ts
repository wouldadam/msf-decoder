import { CreateTimeFrame } from "../../processing/msf";
import type {
  InvalidMark,
  MinuteMark,
  MSFMsg,
  SecondMark,
} from "../../processing/worklets/MSFNode";
import { eventStore, maxEvents } from "../../time";
import Events from "./Events.svelte";

export default {
  title: "Events/Events",
  component: Events,
};

const events: MSFMsg[] = [...Array(maxEvents).keys()]
  .map((t) => {
    let utcTime = new Date().getTime();
    let audioTime = t + Math.random();

    if (t == 0) {
      let mark: MinuteMark = { msg: "minute", utcTime, audioTime };
      return mark;
    } else if (Math.random() > 0.5) {
      let mark: SecondMark = {
        msg: "second",
        utcTime,
        audioTime,
        second: t,
        frame: CreateTimeFrame(),
      };
      return mark;
    } else {
      let mark: InvalidMark = {
        msg: "invalid",
        utcTime,
        audioTime,
        reason: "Test error",
        bits: "101010101",
        second: t,
        frame: CreateTimeFrame(),
      };
      return mark;
    }
  })
  .reverse();

export const Empty = {
  play: () => {
    eventStore.set({ events: [] });
  },
};

export const Full = {
  play: () => {
    eventStore.set({
      events,
    });
  },
};
