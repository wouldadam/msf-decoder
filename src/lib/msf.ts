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
  // -0.8 to +0.8 in 0.1 increments
  dut1?: DUT1;

  // 00 to 99
  year?: number;

  // 01 to 12
  month?: number;

  /// 01 to 31
  dayOfMonth?: number;

  // Day of the week
  dayOfWeek?: DayOfWeek;

  /// 00 to 23
  hour?: number;

  /// 00 to 59
  minute?: number;

  /// Indicates that the summer time flag is about to change
  summerTimeWarning?: boolean;

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

/// Parses the data out of a second segment and returns it in a TimeFrame
/// Returns an error if the data doesn't make sense.
export function parseSecond(
  bits: RingBuffer,
  currentSecond: number,
  currentFrame: TimeFrame
): TimeFrame | Error {
  const newFrame: TimeFrame = {};

  // Parse it
  if (
    currentSecond > 0 &&
    currentSecond <= 8 &&
    bits.at(bBitOffset) == 1 &&
    !currentFrame.dut1
  ) {
    // Positive DUT1
    if (currentFrame.dut1 !== undefined) {
      return Error("multiple dut1 bits set");
    }

    currentFrame.dut1 = (currentSecond / 10) as DUT1;
  } else if (
    currentSecond > 8 &&
    currentSecond <= 16 &&
    bits.at(bBitOffset) == 1 &&
    !currentFrame.dut1
  ) {
    // Negative DUT1
    if (currentFrame.dut1 !== undefined) {
      return Error("multiple dut1 bits set");
    }

    currentFrame.dut1 = ((currentSecond - 8) / 10) as DUT1;
  } else if (currentSecond === 53) {
    // Summer time warning
    currentFrame.summerTimeWarning = bits.at(bBitOffset) === 1;
  } else if (currentSecond === 58) {
    // Summer time
    currentFrame.summerTime = bits.at(bBitOffset) === 1;
  }

  return newFrame;
}
