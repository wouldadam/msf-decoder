import { DayOfWeek, type TimeFrame } from "../processing/msf";
import TimeFrameComp from "./TimeFrame.svelte";

export default {
  title: "Time/TimeFrame",
  component: TimeFrameComp,
};

const basicFrame = {
  year: 23,
  month: 2,
  dayOfMonth: 11,
  dayOfWeek: DayOfWeek.Friday,
  hour: 19,
  minute: 44,
} as TimeFrame;

const completeFrame = {
  ...basicFrame,
  yearComplete: true,
  monthComplete: true,
  dayOfMonthComplete: true,
  dayOfWeekComplete: true,
  hourComplete: true,
  minuteComplete: true,
  dut1: 0.1,
  summerTimeWarning: false,
  summerTime: false,
} as TimeFrame;

const validFrame = {
  ...completeFrame,
  yearParityValid: true,
  dayParityValid: true,
  dayOfWeekParityValid: true,
  timeParityValid: true,
  summerTimeWarning: true,
  summerTime: true,
} as TimeFrame;

const invalidFrame = {
  ...completeFrame,
  yearParityValid: false,
  dayParityValid: false,
  dayOfWeekParityValid: false,
  timeParityValid: false,
} as TimeFrame;

export const Default = {
  args: { frame: {} },
};

export const Populated = {
  args: {
    frame: basicFrame,
  },
};

export const Complete = {
  args: {
    frame: completeFrame,
  },
};

export const Second = {
  args: {
    frame: completeFrame,
    second: 37,
  },
};

export const Valid = {
  args: {
    frame: validFrame,
  },
};

export const Invalid = {
  args: {
    frame: invalidFrame,
  },
};
