import { ValueState, type FrameValue } from "../../processing/msf";
import FrameValueComp from "./FrameValue.svelte";

export default {
  title: "Time/FrameValue",
  component: FrameValueComp,
};

export const Unset = {
  args: {
    value: {
      val: 23,
      state: ValueState.Unset,
    } as FrameValue<number>,
  },
};

export const Value = {
  args: {
    value: {
      val: 23,
      state: ValueState.Incomplete,
    } as FrameValue<number>,
  },
};

export const Complete = {
  args: {
    value: {
      val: 23,
      state: ValueState.Complete,
    } as FrameValue<number>,
  },
};

export const Valid = {
  args: {
    value: {
      val: 23,
      state: ValueState.Valid,
    } as FrameValue<number>,
  },
};

export const Invalid = {
  args: {
    value: {
      val: 23,
      state: ValueState.Invalid,
    } as FrameValue<number>,
  },
};

export const Padding = {
  args: {
    value: {
      val: 23,
      state: ValueState.Valid,
    } as FrameValue<number>,
    padWidth: 4,
  },
};

export const PaddingChar = {
  args: {
    value: {
      val: 23,
      state: ValueState.Valid,
    } as FrameValue<number>,
    padWidth: 4,
    padChar: "X",
  },
};

export const FallbackChar = {
  args: {
    value: {
      val: 23,
      state: ValueState.Unset,
    } as FrameValue<number>,
    fallbackChar: "F",
  },
};
