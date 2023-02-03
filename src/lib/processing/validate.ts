import {
  aBitOffset,
  bBitOffset,
  minuteSegment,
  secondSegment,
} from "./constants";
import type { RingBuffer } from "./RingBuffer";

/// Indicates if the beginning of the buffer is a minute segment
export function isMinuteSegment(bits: RingBuffer) {
  return doesSegmentMatch(bits, minuteSegment);
}

/// Indicates if the beginning of the buffer is a second segment
export function isSecondSegment(bits: RingBuffer) {
  return doesSegmentMatch(bits, secondSegment);
}

/// Indicates if the beginning of the buffer matches the specified segment pattern (-1 indicates wildcard)
function doesSegmentMatch(bits: RingBuffer, segment: ArrayLike<number>) {
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

/// Indicates if the segment at the beginning of the buffer has its fixed bits set correctly
/// assuming it is at the specified second.
export function areFixedBitsValid(
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

  if (!doABBitsMatch(bits, expectedABit, expectedBBit)) {
    return !isFailure;
  }

  return true;
}

/// Validates that the a bit and b bit are set as expected
/// -1 indicates a wildcard.
function doABBitsMatch(
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
