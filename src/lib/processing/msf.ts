import type { RingBuffer } from "./RingBuffer";

// Values for days of the week in a frame
export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

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

// Allowed DUT1 values
export type DUT1 =
  | -0.8
  | -0.7
  | -0.6
  | -0.5
  | -0.4
  | -0.3
  | -0.2
  | -0.1
  | 0
  | 0.1
  | 0.2
  | 0.3
  | 0.4
  | 0.5
  | 0.6
  | 0.7
  | 0.8;

// Frame of MSF information
export interface TimeFrame {
  /// -0.8 to +0.8 in 0.1 increments
  dut1: FrameValue<DUT1>;

  /// 00 to 99
  year: FrameValue<number>;

  // 01 to 12
  month: FrameValue<number>;

  /// 01 to 31
  dayOfMonth: FrameValue<number>;

  // Day of the week
  dayOfWeek: FrameValue<DayOfWeek>;

  /// 00 to 23
  hour: FrameValue<number>;

  /// 00 to 59
  minute: FrameValue<number>;

  /// Indicates that the summer time flag is about to change
  summerTimeWarning: FrameValue<boolean>;

  /// Indicates that the broadcast is in summer time (UTC+1)
  summerTime: FrameValue<boolean>;
}

/// Create a default initialized TimeFrame
export function CreateTimeFrame(): TimeFrame {
  return {
    dut1: CreateFrameValue(0),
    year: CreateFrameValue(0),
    month: CreateFrameValue(0),
    dayOfMonth: CreateFrameValue(0),
    dayOfWeek: CreateFrameValue(DayOfWeek.Sunday),
    hour: CreateFrameValue(0),
    minute: CreateFrameValue(0),
    summerTimeWarning: CreateFrameValue(false),
    summerTime: CreateFrameValue(false),
  };
}

/// The symbols for a minute segment
export const minuteSegment = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0] as const;

/// The symbols for a second segment, -1 indicates variable symbols
export const secondSegment = [1, -1, -1, 0, 0, 0, 0, 0, 0, 0] as const;

// Offset into a segment for the a bit
export const aBitOffset = 1;

// Offset into a segment for the b bit
export const bBitOffset = 2;

/// Bit values for BCD encoded numbers
export const bcdBits = [1, 2, 4, 8, 10, 20, 40, 80] as const;

// Start and end offsets for each data element in a frame (inclusive)
export const offsets = {
  dut1Pos: [1, 8] as const,
  dut1Neg: [9, 16] as const,
  year: [17, 24] as const,
  month: [25, 29] as const,
  dayOfMonth: [30, 35] as const,
  dayOfWeek: [36, 38] as const,
  hour: [39, 44] as const,
  minute: [45, 51] as const,
  summerTimeWarning: [53] as const,
  yearParity: [54] as const,
  dayParity: [55] as const,
  dayOfWeekParity: [56] as const,
  timeParity: [57] as const,
  summerTime: [58, 58] as const,
};

/// Indicates if the beginning of the buffer is a minute segment
export function isMinuteSegment(bits: RingBuffer) {
  return segmentMatch(bits, minuteSegment);
}

/// Indicates if the beginning of the buffer is a second segment
export function isSecondSegment(bits: RingBuffer) {
  return segmentMatch(bits, secondSegment);
}

/// Indicates if the beginning of the buffer matches the specified segment pattern (-1 indicates wildcard)
function segmentMatch(bits: RingBuffer, segment: ArrayLike<number>) {
  if (bits.length < segment.length) {
    return false;
  }

  for (let idx = 0; idx < segment.length; ++idx) {
    if (segment[idx] === -1) {
      continue;
    } else if (segment[idx] !== bits.at(idx)) {
      return false;
    }
  }

  return true;
}

/// Checks the beginning of a buffer for a segments fixed bits
export function validateFixedBits(
  bits: RingBuffer,
  currentSecond: number
): boolean {
  let expectedABit = -1;
  let expectedBBit = -1;

  // If the bit isn't as expected is this a failure
  let isFailure = false;

  if (currentSecond >= 0 && currentSecond <= 16) {
    expectedABit = 0; // Reserved
  } else if (currentSecond >= 17 && currentSecond <= 51) {
    expectedBBit = 0; // Reserved
  } else if (currentSecond === 52) {
    // End sequence
    expectedABit = 0;
    expectedBBit = 0;
    isFailure = true;
  } else if (currentSecond >= 53 && currentSecond <= 58) {
    // End sequence
    expectedABit = 1;
    isFailure = true;
  } else if (currentSecond === 59) {
    // End sequence
    expectedABit = 0;
    expectedBBit = 0;
    isFailure = true;
  }

  if (!validateExpectedBits(bits, expectedABit, expectedBBit)) {
    return !isFailure;
  }

  return true;
}

// Validates that the a bit and b bit are set as expected
function validateExpectedBits(
  bits: RingBuffer,
  expectedABit: number,
  expectedBBit: number
): boolean {
  if (expectedABit !== -1 && expectedABit !== bits.at(aBitOffset)) {
    return false;
  }

  if (expectedBBit !== -1 && expectedBBit !== bits.at(bBitOffset)) {
    return false;
  }

  return true;
}

/// Get the value for a single bit at the specified second
function bcdBitValue(
  currentSecond: number,
  startSecond: number,
  endSecond: number
) {
  const length = endSecond - startSecond;
  const bit = length - (currentSecond - startSecond);
  return bcdBits[bit];
}

function validateParity(
  bitCount: number,
  parityBit: number
): ValueState.Valid | ValueState.Invalid {
  const isEven = bitCount % 2 === 0;
  const expectedParityBit = isEven ? 1 : 0;

  return expectedParityBit === parityBit
    ? ValueState.Valid
    : ValueState.Invalid;
}

/// Parses the data out of a second segment and returns it in a TimeFrame
/// Returns an error if the data doesn't make sense.
export function parseSecond(
  bits: RingBuffer,
  currentSecond: number,
  currentFrame: TimeFrame
): Error | null {
  // Positive DUT1
  if (
    currentSecond >= offsets.dut1Pos[0] &&
    currentSecond <= offsets.dut1Pos[1] &&
    bits.at(bBitOffset) === 1
  ) {
    if (currentFrame.dut1.state !== ValueState.Unset) {
      return Error("Multiple dut1 bits set.");
    }

    currentFrame.dut1.val = (currentSecond / 10) as DUT1;
    currentFrame.dut1.state = ValueState.Incomplete;
    currentFrame.dut1.bitCount += 1;
  }
  // Negative DUT1
  else if (
    currentSecond >= offsets.dut1Neg[0] &&
    currentSecond <= offsets.dut1Neg[1]
  ) {
    if (bits.at(bBitOffset) === 1) {
      if (currentFrame.dut1.state !== ValueState.Unset) {
        return Error("Multiple dut1 bits set.");
      }

      const absDut1 = currentSecond - offsets.dut1Neg[1] - 1;
      currentFrame.dut1.val = (absDut1 / 10) as DUT1;
      currentFrame.dut1.state = ValueState.Incomplete;
      currentFrame.dut1.bitCount += 1;
    }

    // End of DUT1
    if (currentSecond === offsets.dut1Neg[1]) {
      // No bits set
      if (currentFrame.dut1.state === ValueState.Unset) {
        currentFrame.dut1.val = 0 as DUT1;
      }

      currentFrame.dut1.state = ValueState.Valid;
    }
  }
  // Date
  else if (
    currentSecond >= offsets.year[0] &&
    currentSecond <= offsets.year[1]
  ) {
    if (bits.at(aBitOffset) === 1) {
      const value = bcdBitValue(
        currentSecond,
        offsets.year[0],
        offsets.year[1]
      );
      currentFrame.year.val += value;
      currentFrame.year.state = ValueState.Incomplete;
      currentFrame.year.bitCount += 1;
    }

    if (currentSecond === offsets.year[1]) {
      currentFrame.year.state = ValueState.Complete;
    }
  } else if (
    currentSecond >= offsets.month[0] &&
    currentSecond <= offsets.month[1]
  ) {
    if (bits.at(aBitOffset) === 1) {
      const value = bcdBitValue(
        currentSecond,
        offsets.month[0],
        offsets.month[1]
      );
      currentFrame.month.val += value;
      currentFrame.month.state = ValueState.Incomplete;
      currentFrame.month.bitCount += 1;
    }

    if (currentSecond === offsets.month[1]) {
      currentFrame.month.state = ValueState.Complete;
    }
  } else if (
    currentSecond >= offsets.dayOfMonth[0] &&
    currentSecond <= offsets.dayOfMonth[1]
  ) {
    if (bits.at(aBitOffset) === 1) {
      const value = bcdBitValue(
        currentSecond,
        offsets.dayOfMonth[0],
        offsets.dayOfMonth[1]
      );
      currentFrame.dayOfMonth.val += value;
      currentFrame.dayOfMonth.state = ValueState.Incomplete;
      currentFrame.dayOfMonth.bitCount += 1;
    }

    if (currentSecond === offsets.dayOfMonth[1]) {
      currentFrame.dayOfMonth.state = ValueState.Complete;
    }
  } else if (
    currentSecond >= offsets.dayOfWeek[0] &&
    currentSecond <= offsets.dayOfWeek[1]
  ) {
    if (bits.at(aBitOffset) === 1) {
      const value = bcdBitValue(
        currentSecond,
        offsets.dayOfWeek[0],
        offsets.dayOfWeek[1]
      );
      currentFrame.dayOfWeek.val += value;
      currentFrame.dayOfWeek.state = ValueState.Incomplete;
      currentFrame.dayOfWeek.bitCount += 1;
    }

    if (currentSecond === offsets.dayOfWeek[1]) {
      currentFrame.dayOfWeek.state = ValueState.Complete;
    }
  }
  // Time
  else if (
    currentSecond >= offsets.hour[0] &&
    currentSecond <= offsets.hour[1]
  ) {
    if (bits.at(aBitOffset) === 1) {
      const value = bcdBitValue(
        currentSecond,
        offsets.hour[0],
        offsets.hour[1]
      );
      currentFrame.hour.val += value;
      currentFrame.hour.state = ValueState.Incomplete;
      currentFrame.hour.bitCount += 1;
    }

    if (currentSecond === offsets.hour[1]) {
      currentFrame.hour.state = ValueState.Complete;
    }
  } else if (
    currentSecond >= offsets.minute[0] &&
    currentSecond <= offsets.minute[1]
  ) {
    if (bits.at(aBitOffset) === 1) {
      const value = bcdBitValue(
        currentSecond,
        offsets.minute[0],
        offsets.minute[1]
      );
      currentFrame.minute.val += value;
      currentFrame.minute.state = ValueState.Incomplete;
      currentFrame.minute.bitCount += 1;
    }

    if (currentSecond === offsets.minute[1]) {
      currentFrame.minute.state = ValueState.Complete;
    }
  }
  // Summer time warning
  else if (currentSecond === offsets.summerTimeWarning[0]) {
    currentFrame.summerTimeWarning.val = bits.at(bBitOffset) === 1;
    currentFrame.summerTimeWarning.state = ValueState.Valid;
    currentFrame.summerTimeWarning.bitCount += 1;
  }
  // Parity
  else if (currentSecond === offsets.yearParity[0]) {
    const parityBit = bits.at(bBitOffset);
    const state = validateParity(currentFrame.year.bitCount, parityBit);
    currentFrame.year.state = state;
  } else if (currentSecond === offsets.dayParity[0]) {
    const parityBit = bits.at(bBitOffset);
    const bitCount =
      currentFrame.month.bitCount + currentFrame.dayOfMonth.bitCount;
    const state = validateParity(bitCount, parityBit);
    currentFrame.month.state = state;
    currentFrame.dayOfMonth.state = state;
  } else if (currentSecond === offsets.dayOfWeekParity[0]) {
    const parityBit = bits.at(bBitOffset);
    const state = validateParity(currentFrame.dayOfWeek.bitCount, parityBit);
    currentFrame.dayOfWeek.state = state;
  } else if (currentSecond === offsets.timeParity[0]) {
    const parityBit = bits.at(bBitOffset);
    const bitCount = currentFrame.hour.bitCount + currentFrame.minute.bitCount;
    const state = validateParity(bitCount, parityBit);
    currentFrame.hour.state = state;
    currentFrame.minute.state = state;
  }
  // Summer time
  else if (currentSecond === offsets.summerTime[0]) {
    currentFrame.summerTime.val = bits.at(bBitOffset) === 1;
    currentFrame.summerTime.state = ValueState.Valid;
    currentFrame.summerTime.bitCount += 1;
  }

  return null;
}
