import { aBitOffset, bBitOffset, bcdBits, secondOffsets } from "./constants";
import { ValueState } from "./FrameValue";
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
    currentSecond <= secondOffsets.dut1Pos[1] &&
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
    currentSecond >= secondOffsets.dut1Neg[0] &&
    currentSecond <= secondOffsets.dut1Neg[1]
  ) {
    if (bits.at(bBitOffset) === 1) {
      if (currentFrame.dut1.state !== ValueState.Unset) {
        return Error("Multiple dut1 bits set.");
      }

      const absDut1 = currentSecond - secondOffsets.dut1Neg[1] - 1;
      currentFrame.dut1.val = (absDut1 / 10) as DUT1;
      currentFrame.dut1.state = ValueState.Incomplete;
      currentFrame.dut1.bitCount += 1;
    }

    // End of DUT1
    if (currentSecond === secondOffsets.dut1Neg[1]) {
      // No bits set
      if (currentFrame.dut1.state === ValueState.Unset) {
        currentFrame.dut1.val = 0 as DUT1;
      }

      currentFrame.dut1.state = ValueState.Valid;
    }
  }
  // Date
  else if (
    currentSecond >= secondOffsets.year[0] &&
    currentSecond <= secondOffsets.year[1]
  ) {
    if (bits.at(aBitOffset) === 1) {
      const value = bcdBitValue(
        currentSecond,
        secondOffsets.year[0],
        secondOffsets.year[1]
      );
      currentFrame.year.val += value;
      currentFrame.year.state = ValueState.Incomplete;
      currentFrame.year.bitCount += 1;
    }

    if (currentSecond === secondOffsets.year[1]) {
      currentFrame.year.state = ValueState.Complete;
    }
  } else if (
    currentSecond >= secondOffsets.month[0] &&
    currentSecond <= secondOffsets.month[1]
  ) {
    if (bits.at(aBitOffset) === 1) {
      const value = bcdBitValue(
        currentSecond,
        secondOffsets.month[0],
        secondOffsets.month[1]
      );
      currentFrame.month.val += value;
      currentFrame.month.state = ValueState.Incomplete;
      currentFrame.month.bitCount += 1;
    }

    if (currentSecond === secondOffsets.month[1]) {
      currentFrame.month.state = ValueState.Complete;
    }
  } else if (
    currentSecond >= secondOffsets.dayOfMonth[0] &&
    currentSecond <= secondOffsets.dayOfMonth[1]
  ) {
    if (bits.at(aBitOffset) === 1) {
      const value = bcdBitValue(
        currentSecond,
        secondOffsets.dayOfMonth[0],
        secondOffsets.dayOfMonth[1]
      );
      currentFrame.dayOfMonth.val += value;
      currentFrame.dayOfMonth.state = ValueState.Incomplete;
      currentFrame.dayOfMonth.bitCount += 1;
    }

    if (currentSecond === secondOffsets.dayOfMonth[1]) {
      currentFrame.dayOfMonth.state = ValueState.Complete;
    }
  } else if (
    currentSecond >= secondOffsets.dayOfWeek[0] &&
    currentSecond <= secondOffsets.dayOfWeek[1]
  ) {
    if (bits.at(aBitOffset) === 1) {
      const value = bcdBitValue(
        currentSecond,
        secondOffsets.dayOfWeek[0],
        secondOffsets.dayOfWeek[1]
      );
      currentFrame.dayOfWeek.val += value;
      currentFrame.dayOfWeek.state = ValueState.Incomplete;
      currentFrame.dayOfWeek.bitCount += 1;
    }

    if (currentSecond === secondOffsets.dayOfWeek[1]) {
      currentFrame.dayOfWeek.state = ValueState.Complete;
    }
  }
  // Time
  else if (
    currentSecond >= secondOffsets.hour[0] &&
    currentSecond <= secondOffsets.hour[1]
  ) {
    if (bits.at(aBitOffset) === 1) {
      const value = bcdBitValue(
        currentSecond,
        secondOffsets.hour[0],
        secondOffsets.hour[1]
      );
      currentFrame.hour.val += value;
      currentFrame.hour.state = ValueState.Incomplete;
      currentFrame.hour.bitCount += 1;
    }

    if (currentSecond === secondOffsets.hour[1]) {
      currentFrame.hour.state = ValueState.Complete;
    }
  } else if (
    currentSecond >= secondOffsets.minute[0] &&
    currentSecond <= secondOffsets.minute[1]
  ) {
    if (bits.at(aBitOffset) === 1) {
      const value = bcdBitValue(
        currentSecond,
        secondOffsets.minute[0],
        secondOffsets.minute[1]
      );
      currentFrame.minute.val += value;
      currentFrame.minute.state = ValueState.Incomplete;
      currentFrame.minute.bitCount += 1;
    }

    if (currentSecond === secondOffsets.minute[1]) {
      currentFrame.minute.state = ValueState.Complete;
    }
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
