import FrameValue from "./FrameValue.svelte";

export default {
  title: "Time/FrameValue",
  component: FrameValue,
};

export const Default = {};

export const Value = {
  args: {
    value: 23,
  },
};

export const Complete = {
  args: {
    value: 23,
    isComplete: true,
  },
};

export const Valid = {
  args: {
    value: 23,
    isComplete: true,
    isValid: true,
  },
};

export const Invalid = {
  args: {
    value: 23,
    isComplete: true,
    isValid: false,
  },
};

export const Padding = {
  args: {
    value: 23,
    padWidth: 4,
  },
};

export const PaddingChar = {
  args: {
    value: 23,
    padWidth: 4,
    padChar: "X",
  },
};

export const FallbackChar = {
  args: {
    fallbackChar: "F",
  },
};
