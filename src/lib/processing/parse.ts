import { aBitOffset, bBitOffset, bcdBits, secondOffsets } from "./constants";
import { ValueState, type FrameValue } from "./FrameValue";
import type { RingBuffer } from "./RingBuffer";
import type { DUT1, TimeFrame } from "./TimeFrame";

/// Get the value for a single BCD bit at the specified second
function bcdBitValue(
  currentSecond: number,
  startSecond: number,
  endSecond: number
) {
  const length = endSecond - startSecond; // Total length of the value
  const bitIdx = length - (currentSecond - startSecond); // Index of the bit this second is for
  return bcdBits[bitIdx];
}

/// Gets the Value for a bit count and received parity bit
function getParityState(
  bitCount: number,
  parityBit: number
): ValueState.Valid | ValueState.Invalid {
  const isEven = bitCount % 2 === 0;
  const expectedParityBit = isEven ? 1 : 0;

  return expectedParityBit === parityBit
    ? ValueState.Valid
    : ValueState.Invalid;
}

/// Increments a numeric FrameValue based on a specified bit in the buffer
/// and the current second.
function updateFrameValue(
  frameValue: FrameValue<number>,
  bits: RingBuffer,
  valueBitOffset: number,
  currentSecond: number,
  startSecond: number,
  endSecond: number
) {
  if (bits.at(valueBitOffset) === 1) {
    const value = bcdBitValue(currentSecond, startSecond, endSecond);
    frameValue.val += value;
    frameValue.bitCount += 1;
  }

  if (currentSecond === endSecond) {
    frameValue.state = ValueState.Complete;
  } else {
    frameValue.state = ValueState.Incomplete;
  }
}

/// Parses the data out of a second segment and populates the TimeFrame.
/// Returns an error if the data doesn't make sense.
export function parseSecond(
  bits: RingBuffer,
  currentSecond: number,
  currentFrame: TimeFrame
): Error | null {
  // Positive DUT1
  if (
    currentSecond >= secondOffsets.dut1Pos[0] &&
    currentSecond <= secondOffsets.dut1Pos[1]
  ) {
    if (bits.at(bBitOffset) === 1) {
      if (currentFrame.dut1.state !== ValueState.Unset) {
        return Error("Multiple dut1 bits set.");
      }

      currentFrame.dut1.val = (currentSecond / 10) as DUT1;
      currentFrame.dut1.bitCount += 1;
    }

    currentFrame.dut1.state = ValueState.Incomplete;
  }
  // Negative DUT1
  else if (
    currentSecond >= secondOffsets.dut1Neg[0] &&
    currentSecond <= secondOffsets.dut1Neg[1]
  ) {
    if (bits.at(bBitOffset) === 1) {
      if (currentFrame.dut1.state !== ValueState.Unset) {
        return Error("Multiple dut1 bits set.");
      }

      const absDut1 = currentSecond - secondOffsets.dut1Neg[1] - 1;
      currentFrame.dut1.val = (absDut1 / 10) as DUT1;
      currentFrame.dut1.bitCount += 1;
    }

    // End of DUT1
    if (currentSecond === secondOffsets.dut1Neg[1]) {
      // No bits set
      if (currentFrame.dut1.state === ValueState.Unset) {
        currentFrame.dut1.val = 0 as DUT1;
      }

      currentFrame.dut1.state = ValueState.Valid;
    } else {
      currentFrame.dut1.state = ValueState.Incomplete;
    }
  }
  // Date
  else if (
    currentSecond >= secondOffsets.year[0] &&
    currentSecond <= secondOffsets.year[1]
  ) {
    updateFrameValue(
      currentFrame.year,
      bits,
      aBitOffset,
      currentSecond,
      secondOffsets.year[0],
      secondOffsets.year[1]
    );
  } else if (
    currentSecond >= secondOffsets.month[0] &&
    currentSecond <= secondOffsets.month[1]
  ) {
    updateFrameValue(
      currentFrame.month,
      bits,
      aBitOffset,
      currentSecond,
      secondOffsets.month[0],
      secondOffsets.month[1]
    );
  } else if (
    currentSecond >= secondOffsets.dayOfMonth[0] &&
    currentSecond <= secondOffsets.dayOfMonth[1]
  ) {
    updateFrameValue(
      currentFrame.dayOfMonth,
      bits,
      aBitOffset,
      currentSecond,
      secondOffsets.dayOfMonth[0],
      secondOffsets.dayOfMonth[1]
    );
  } else if (
    currentSecond >= secondOffsets.dayOfWeek[0] &&
    currentSecond <= secondOffsets.dayOfWeek[1]
  ) {
    updateFrameValue(
      currentFrame.dayOfWeek,
      bits,
      aBitOffset,
      currentSecond,
      secondOffsets.dayOfWeek[0],
      secondOffsets.dayOfWeek[1]
    );
  }
  // Time
  else if (
    currentSecond >= secondOffsets.hour[0] &&
    currentSecond <= secondOffsets.hour[1]
  ) {
    updateFrameValue(
      currentFrame.hour,
      bits,
      aBitOffset,
      currentSecond,
      secondOffsets.hour[0],
      secondOffsets.hour[1]
    );
  } else if (
    currentSecond >= secondOffsets.minute[0] &&
    currentSecond <= secondOffsets.minute[1]
  ) {
    updateFrameValue(
      currentFrame.minute,
      bits,
      aBitOffset,
      currentSecond,
      secondOffsets.minute[0],
      secondOffsets.minute[1]
    );
  }
  // Summer time warning
  else if (currentSecond === secondOffsets.summerTimeWarning[0]) {
    currentFrame.summerTimeWarning.val = bits.at(bBitOffset) === 1;
    currentFrame.summerTimeWarning.state = ValueState.Valid;
    currentFrame.summerTimeWarning.bitCount += 1;
  }
  // Parity
  else if (currentSecond === secondOffsets.yearParity[0]) {
    const parityBit = bits.at(bBitOffset);
    const state = getParityState(currentFrame.year.bitCount, parityBit);
    currentFrame.year.state = state;
  } else if (currentSecond === secondOffsets.dayParity[0]) {
    const parityBit = bits.at(bBitOffset);
    const bitCount =
      currentFrame.month.bitCount + currentFrame.dayOfMonth.bitCount;
    const state = getParityState(bitCount, parityBit);
    currentFrame.month.state = state;
    currentFrame.dayOfMonth.state = state;
  } else if (currentSecond === secondOffsets.dayOfWeekParity[0]) {
    const parityBit = bits.at(bBitOffset);
    const state = getParityState(currentFrame.dayOfWeek.bitCount, parityBit);
    currentFrame.dayOfWeek.state = state;
  } else if (currentSecond === secondOffsets.timeParity[0]) {
    const parityBit = bits.at(bBitOffset);
    const bitCount = currentFrame.hour.bitCount + currentFrame.minute.bitCount;
    const state = getParityState(bitCount, parityBit);
    currentFrame.hour.state = state;
    currentFrame.minute.state = state;
  }
  // Summer time
  else if (currentSecond === secondOffsets.summerTime[0]) {
    currentFrame.summerTime.val = bits.at(bBitOffset) === 1;
    currentFrame.summerTime.state = ValueState.Valid;
    currentFrame.summerTime.bitCount += 1;
  }

  return null;
}
