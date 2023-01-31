import { expect, test, type Mock } from "vitest";
import {
  bcdBits,
  DayOfWeek,
  minuteSegment,
  offsets,
  ValueState,
  type TimeFrame,
} from "../processing/msf";
import { MSFProcessor } from "./MSFProcessor";

const symbolRate = 10;
const audioBufferLength = 128;

/// A function that populates some of the input samples from the start provided buffer
type InputOp = (input: Float32Array) => void;

/// A input function and the number of samples it populates
type InputDesc = [InputOp, number];

/// Creates an InputDesc that makes a minute segment
function minuteDesc(): InputDesc {
  return symbolDesc(minuteSegment);
}

/// Creates an InputDesc that makes a second segment
function secondDesc(bitA: number, bitB: number): InputDesc {
  const symbols = [1, bitA, bitB, 0, 0, 0, 0, 0, 0, 0];
  return symbolDesc(symbols);
}

/// Creates an InputDesc that makes a specified set of symbols
function symbolDesc(segment: ArrayLike<number>): InputDesc {
  const samplesPerSymbol = sampleRate / symbolRate;

  return [
    (dest) => {
      for (let idx = 0; idx < segment.length; ++idx) {
        const start = idx * samplesPerSymbol;
        const end = start + samplesPerSymbol;
        dest.fill(segment[idx], start, end);
      }
    },
    samplesPerSymbol * segment.length,
  ];
}

/// Creates an InputDesc that fills with zeros
function zeroDesc(sampleCount: number): InputDesc {
  return [
    (dest) => {
      dest.fill(0, 0, sampleCount);
    },
    sampleCount,
  ];
}

/// Takes a series of InputDescs and uses them to create the full buffer of input samples
function createInput(segments: Array<InputDesc>): Float32Array {
  let sampleCount = segments.reduce((sum, desc) => sum + desc[1], 0);
  sampleCount = Math.ceil(sampleCount / audioBufferLength) * audioBufferLength;

  const input = new Float32Array(sampleCount);

  let idx = 0;
  for (const desc of segments) {
    desc[0](input.subarray(idx));
    idx += desc[1];
  }

  return input;
}

/// Feeds input samples to the given processor in audioBufferLength increments
function feedProcessor(processor: MSFProcessor, input: Float32Array) {
  for (let idx = 0; idx < input.length; ) {
    processor.process([[input.subarray(idx, idx + audioBufferLength)]], [], {});
    idx += audioBufferLength;
  }
}

/// Convert a value to the BCD format used in the MSF frames
function toBCD(value: number, length: number) {
  const bits: number[] = [];
  let bitCount = 0;

  for (let bit = 0; bit < length; ++bit) {
    const bitValue = bcdBits[length - bit - 1];

    if (value < bitValue) {
      bits.push(0);
    } else {
      value -= bitValue;
      bitCount += 1;
      bits.push(1);
    }
  }

  const parity = bitCount % 2 == 0 ? 1 : 0;

  return [bits, parity, bitCount] as const;
}

/// Creates all of the segments for and entire frame
function createFrameSegments(frame: TimeFrame): Array<InputDesc> {
  const ops = [minuteDesc()];

  let dut1Bit = frame.dut1.val * 10;
  if (dut1Bit < 0) {
    dut1Bit = Math.abs(dut1Bit) + 8;
  }

  const [yearBits, yearParity, yearBitCount] = toBCD(frame.year.val, 8);
  const [monthBits, monthParity, monthBitCount] = toBCD(frame.month.val, 5);
  const [dayOfMonthBits, dayOfMonthParity, dayOfMonthBitCount] = toBCD(
    frame.dayOfMonth.val,
    6
  );
  const [dayOfWeekBits, dayOfWeekParity, dayOfWeekBitCount] = toBCD(
    frame.dayOfWeek.val,
    3
  );
  const [hourBits, hourParity, hourBitCount] = toBCD(frame.hour.val, 6);
  const [minuteBits, minuteParity, minuteBitCount] = toBCD(frame.minute.val, 7);

  // Day and time parity are multiple fields combined
  const dayParity = monthParity + dayOfMonthParity === 1 ? 0 : 1;
  const timeParity = hourParity + minuteParity === 1 ? 0 : 1;

  frame.dut1.bitCount = 1;
  frame.year.bitCount = yearBitCount;
  frame.month.bitCount = monthBitCount;
  frame.dayOfMonth.bitCount = dayOfMonthBitCount;
  frame.dayOfWeek.bitCount = dayOfWeekBitCount;
  frame.hour.bitCount = hourBitCount;
  frame.minute.bitCount = minuteBitCount;
  frame.summerTimeWarning.bitCount = 1;
  frame.summerTime.bitCount = 1;

  for (let second = 1; second < 60; ++second) {
    if (dut1Bit != 0 && second === dut1Bit) {
      ops.push(secondDesc(0, 1));
    }
    // Date
    else if (second >= offsets.year[0] && second <= offsets.year[1]) {
      ops.push(secondDesc(yearBits[second - offsets.year[0]], 0));
    } else if (second >= offsets.month[0] && second <= offsets.month[1]) {
      ops.push(secondDesc(monthBits[second - offsets.month[0]], 0));
    } else if (
      second >= offsets.dayOfMonth[0] &&
      second <= offsets.dayOfMonth[1]
    ) {
      ops.push(secondDesc(dayOfMonthBits[second - offsets.dayOfMonth[0]], 0));
    } else if (
      second >= offsets.dayOfWeek[0] &&
      second <= offsets.dayOfWeek[1]
    ) {
      ops.push(secondDesc(dayOfWeekBits[second - offsets.dayOfWeek[0]], 0));
    }
    // Time
    else if (second >= offsets.hour[0] && second <= offsets.hour[1]) {
      ops.push(secondDesc(hourBits[second - offsets.hour[0]], 0));
    } else if (second >= offsets.minute[0] && second <= offsets.minute[1]) {
      ops.push(secondDesc(minuteBits[second - offsets.minute[0]], 0));
    }
    // Marker
    else if (second === offsets.summerTimeWarning[0]) {
      ops.push(secondDesc(1, frame.summerTimeWarning.val ? 1 : 0));
    } else if (second === offsets.yearParity[0]) {
      ops.push(secondDesc(1, yearParity));
    } else if (second === offsets.dayParity[0]) {
      ops.push(secondDesc(1, dayParity));
    } else if (second === offsets.dayOfWeekParity[0]) {
      ops.push(secondDesc(1, dayOfWeekParity));
    } else if (second === offsets.timeParity[0]) {
      ops.push(secondDesc(1, timeParity));
    } else if (second === offsets.summerTime[0]) {
      ops.push(secondDesc(1, frame.summerTime.val ? 1 : 0));
    } else {
      ops.push(secondDesc(0, 0));
    }
  }

  return ops;
}

// Offset is multiplier on samplesPerSymbol
test.each([0, 0.25, 0.5, 0.75, 1, 60])(
  "decode full frame with %dx symbol offset",
  (offset: number) => {
    const samplesPerSymbol = sampleRate / symbolRate;

    // Create a processor
    const processor = new MSFProcessor({
      processorOptions: {
        symbolRate,
      },
    });

    // Create each of the message segments to send
    const frame: TimeFrame = {
      dut1: { val: 0.1, bitCount: 0, state: ValueState.Valid },
      year: { val: 33, bitCount: 0, state: ValueState.Valid },
      month: { val: 10, bitCount: 0, state: ValueState.Valid },
      dayOfMonth: { val: 11, bitCount: 0, state: ValueState.Valid },
      dayOfWeek: {
        val: DayOfWeek.Monday,
        bitCount: 0,
        state: ValueState.Valid,
      },
      hour: { val: 20, bitCount: 0, state: ValueState.Valid },
      minute: { val: 44, bitCount: 0, state: ValueState.Valid },
      summerTimeWarning: { val: false, bitCount: 0, state: ValueState.Valid },
      summerTime: { val: true, bitCount: 0, state: ValueState.Valid },
    };

    const segments: Array<InputDesc> = createFrameSegments(frame);

    // Insert any offset samples
    const sampleOffset = samplesPerSymbol * offset;
    segments.unshift(zeroDesc(sampleOffset));

    // Turn them into bits
    const input = createInput(segments);

    // Funnel all the data into the processor
    feedProcessor(processor, input);

    // Check we got the expected decode messages
    const mockPost = processor.port.postMessage as Mock;
    const callCount = mockPost.mock.calls.length;
    expect(callCount).toBeGreaterThanOrEqual(60);

    // Should have a minute marker
    expect(processor.port.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "minute",
      })
    );

    // Should have 59 second markers in order
    let secondCount = 0;
    for (let call = 0; call < callCount; ++call) {
      if (mockPost.mock.calls[call][0].msg == "second") {
        expect(processor.port.postMessage).toHaveBeenNthCalledWith(
          call + 1,
          expect.objectContaining({
            msg: "second",
            second: secondCount + 1,
          })
        );

        secondCount += 1;
      }
    }
    expect(secondCount).toBe(59);

    // Last second should contain full frame with all fields complete and parity checks valid
    const expectedFrame: TimeFrame = { ...frame };
    expect(processor.port.postMessage).toHaveBeenNthCalledWith(
      callCount,
      expect.objectContaining({
        msg: "second",
        second: 59,
        frame: expect.objectContaining(expectedFrame),
      })
    );
  }
);

test.todo("decode frame with failed parity", () => {});
test.todo("decode frame with bad bits", () => {});
test.todo("decode multiple frames", () => {});
