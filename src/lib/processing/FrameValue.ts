/// The state of a value
export enum ValueState {
  Unset, // Not yet set
  Incomplete, // Some bits received
  Complete, // All bits received
  Valid, // Passed any validation
  Invalid, // Failed any validation
}

/// Represents a single value in a TimeFrame
export interface FrameValue<T> {
  val: T;
  state: ValueState;
  bitCount: number;
}

/// Creates a default unset frame value
export function CreateFrameValue<T>(unsetVal: T): FrameValue<T> {
  return {
    val: unsetVal,
    state: ValueState.Unset,
    bitCount: 0,
  };
}
