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
  dut1?: DUT1;

  /// 00 to 99
  year?: number;

  /// Year has been fully decoded
  yearComplete?: boolean;

  /// The number of bits set in the year
  yearBitCount?: number;

  // 01 to 12
  month?: number;

  /// Month has been fully decoded
  monthComplete?: boolean;

  /// The number of bits set in the month
  monthBitCount?: number;

  /// 01 to 31
  dayOfMonth?: number;

  /// Day of month has been fully decoded
  dayOfMonthComplete?: boolean;

  /// The number of bits set in the day of month
  dayOfMonthBitCount?: number;

  // Day of the week
  dayOfWeek?: DayOfWeek;

  /// Day of week has been fully decoded
  dayOfWeekComplete?: boolean;

  /// The number of bits set in the day of week
  dayOfWeekBitCount?: number;

  /// 00 to 23
  hour?: number;

  /// Hour has been fully decoded
  hourComplete?: boolean;

  /// The number of bits set in the hour
  hourBitCount?: number;

  /// 00 to 59
  minute?: number;

  /// Minute has been fully decoded
  minuteComplete?: boolean;

  /// The number of bits set in the minute
  minuteBitCount?: number;

  /// Indicates that the summer time flag is about to change
  summerTimeWarning?: boolean;

  /// The odd parity value of the year
  yearParity?: number;

  /// Indicates if the year parity check passed
  yearParityValid?: boolean;

  /// The odd parity value of the month + day of month
  dayParity?: number;

  /// Indicates if the day parity check passed
  dayParityValid?: boolean;

  /// The odd parity value of the day of week
  dayOfWeekParity?: number;

  /// Indicates if the dayOfWeek parity check passed
  dayOfWeekParityValid?: boolean;

  /// The odd parity value of the hour minute
  timeParity?: number;

  /// Indicates if the time parity check passed
  timeParityValid?: boolean;

  /// Indicates that the broadcast is in summer time (UTC+1)
  summerTime?: boolean;
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

function validateParity(bitCount: number, parityBit: number): boolean {
  const isEven = bitCount % 2 === 0;
  const expectedParityBit = isEven ? 1 : 0;
  return expectedParityBit === parityBit;
}

/// Parses the data out of a second segment and returns it in a TimeFrame
/// Returns an error if the data doesn't make sense.
export function parseSecond(
  bits: RingBuffer,
  currentSecond: number,
  currentFrame: TimeFrame
): TimeFrame | Error {
  const newFrame: TimeFrame = {};

  // Positive DUT1
  if (
    currentSecond >= offsets.dut1Pos[0] &&
    currentSecond <= offsets.dut1Pos[1] &&
    bits.at(bBitOffset) === 1
  ) {
    if (currentFrame.dut1 !== undefined) {
      return Error("multiple dut1 bits set");
    }

    currentFrame.dut1 = (currentSecond / 10) as DUT1;
  }
  // Negative DUT1
  else if (
    currentSecond >= offsets.dut1Neg[0] &&
    currentSecond <= offsets.dut1Neg[1] &&
    bits.at(bBitOffset) === 1
  ) {
    if (currentFrame.dut1 !== undefined) {
      return Error("multiple dut1 bits set");
    }

    const absDut1 = currentSecond - offsets.dut1Neg[1] - 1;
    currentFrame.dut1 = (absDut1 / 10) as DUT1;
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
      newFrame.year = (currentFrame?.year ?? 0) + value;
      newFrame.yearBitCount = (currentFrame.yearBitCount ?? 0) + 1;
    }

    if (currentSecond === offsets.year[1]) {
      newFrame.yearComplete = true;
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
      newFrame.month = (currentFrame?.month ?? 0) + value;
      newFrame.monthBitCount = (currentFrame.monthBitCount ?? 0) + 1;
    }

    if (currentSecond === offsets.month[1]) {
      newFrame.monthComplete = true;
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
      newFrame.dayOfMonth = (currentFrame?.dayOfMonth ?? 0) + value;
      newFrame.dayOfMonthBitCount = (currentFrame.dayOfMonthBitCount ?? 0) + 1;
    }

    if (currentSecond === offsets.dayOfMonth[1]) {
      newFrame.dayOfMonthComplete = true;
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
      newFrame.dayOfWeek = (currentFrame?.dayOfWeek ?? 0) + value;
      newFrame.dayOfWeekBitCount = (currentFrame.dayOfWeekBitCount ?? 0) + 1;
    }

    if (currentSecond === offsets.dayOfWeek[1]) {
      newFrame.dayOfWeekComplete = true;
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
      newFrame.hour = (currentFrame?.hour ?? 0) + value;
      newFrame.hourBitCount = (currentFrame.hourBitCount ?? 0) + 1;
    }

    if (currentSecond === offsets.hour[1]) {
      newFrame.hourComplete = true;
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
      newFrame.minute = (currentFrame?.minute ?? 0) + value;
      newFrame.minuteBitCount = (currentFrame.minuteBitCount ?? 0) + 1;
    }

    if (currentSecond === offsets.minute[1]) {
      newFrame.minuteComplete = true;
    }
  }
  // Summer time warning
  else if (currentSecond === offsets.summerTimeWarning[0]) {
    newFrame.summerTimeWarning = bits.at(bBitOffset) === 1;
  }
  // Parity
  else if (currentSecond === offsets.yearParity[0]) {
    newFrame.yearParity = bits.at(bBitOffset);
    newFrame.yearParityValid = validateParity(
      currentFrame.yearBitCount,
      newFrame.yearParity
    );
  } else if (currentSecond === offsets.dayParity[0]) {
    newFrame.dayParity = bits.at(bBitOffset);
    const bitCount =
      currentFrame.monthBitCount + currentFrame.dayOfMonthBitCount;
    newFrame.dayParityValid = validateParity(bitCount, newFrame.dayParity);
  } else if (currentSecond === offsets.dayOfWeekParity[0]) {
    newFrame.dayOfWeekParity = bits.at(bBitOffset);
    newFrame.dayOfWeekParityValid = validateParity(
      currentFrame.dayOfWeekBitCount,
      newFrame.dayOfWeekParity
    );
  } else if (currentSecond === offsets.timeParity[0]) {
    newFrame.timeParity = bits.at(bBitOffset);
    const bitCount = currentFrame.hourBitCount + currentFrame.minuteBitCount;
    newFrame.timeParityValid = validateParity(bitCount, newFrame.timeParity);
  }
  // Summer time
  else if (currentSecond === offsets.summerTime[0]) {
    currentFrame.summerTime = bits.at(bBitOffset) === 1;
  }

  return newFrame;
}
