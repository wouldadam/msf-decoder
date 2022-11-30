import {
  CreateTimeFrame,
  DayOfWeek,
  ValueState,
  type TimeFrame,
} from "../processing/msf";
import TimeFrameComp from "./TimeFrame.svelte";

export default {
  title: "Time/TimeFrame",
  component: TimeFrameComp,
};

const basicFrame = {
  dut1: { val: 0.1, state: ValueState.Incomplete, bitCount: 0 },
  year: { val: 23, state: ValueState.Incomplete, bitCount: 0 },
  month: { val: 2, state: ValueState.Incomplete, bitCount: 0 },
  dayOfMonth: { val: 11, state: ValueState.Incomplete, bitCount: 0 },
  dayOfWeek: {
    val: DayOfWeek.Friday,
    state: ValueState.Incomplete,
    bitCount: 0,
  },
  hour: { val: 19, state: ValueState.Incomplete, bitCount: 0 },
  minute: { val: 44, state: ValueState.Incomplete, bitCount: 0 },
  summerTimeWarning: { val: false, state: ValueState.Incomplete, bitCount: 0 },
  summerTime: { val: false, state: ValueState.Incomplete, bitCount: 0 },
} as TimeFrame;

const completeFrame = JSON.parse(JSON.stringify(basicFrame)) as TimeFrame;
Object.values(completeFrame).forEach(
  (value) => (value.state = ValueState.Complete)
);

const validFrame = JSON.parse(JSON.stringify(basicFrame)) as TimeFrame;
validFrame.summerTime.val = true;
validFrame.summerTimeWarning.val = true;
Object.values(validFrame).forEach((value) => (value.state = ValueState.Valid));

const invalidFrame = JSON.parse(JSON.stringify(basicFrame)) as TimeFrame;
Object.values(invalidFrame).forEach(
  (value) => (value.state = ValueState.Invalid)
);

export const Default = {
  args: { frame: CreateTimeFrame() },
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
