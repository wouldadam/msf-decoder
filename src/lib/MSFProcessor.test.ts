import { expect, test } from "vitest";
import { DayOfWeek, minuteSegment, type TimeFrame } from "./msf";
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
  const sampleCount = segments.reduce((sum, desc) => sum + desc[1], 0);

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

/// Creates all of the segments for and entire frame
function createFrameSegments(frame: TimeFrame): Array<InputDesc> {
  const ops = [minuteDesc()];

  let dut1Bit = frame.dut1 * 10;
  if (dut1Bit < 0) {
    dut1Bit = Math.abs(dut1Bit) + 8;
  }

  for (let second = 1; second < 60; ++second) {
    if (dut1Bit != 0 && second === dut1Bit) {
      ops.push(secondDesc(0, 1));
    } else if (second === 53) {
      ops.push(secondDesc(1, frame.summerTimeWarning ? 1 : 0));
    } else if (second === 54) {
      ops.push(secondDesc(1, 0));
    } else if (second === 55) {
      ops.push(secondDesc(1, 0));
    } else if (second === 56) {
      ops.push(secondDesc(1, 0));
    } else if (second === 57) {
      ops.push(secondDesc(1, 0));
    } else if (second === 58) {
      ops.push(secondDesc(1, frame.summerTime ? 1 : 0));
    } else {
      ops.push(secondDesc(0, 0));
    }
  }

  return ops;
}

test("decode full frame", () => {
  const samplesPerSymbol = sampleRate / symbolRate;

  // Create a processor
  const processor = new MSFProcessor({
    processorOptions: {
      symbolRate,
    },
  });

  // Create each of the message segments to send
  const frame: TimeFrame = {
    dut1: 0.1,
    year: 33,
    month: 10,
    dayOfMonth: 11,
    dayOfWeek: DayOfWeek.Monday,
    hour: 20,
    minute: 44,
    summerTimeWarning: false,
    summerTime: true,
  };

  const segments: Array<InputDesc> = createFrameSegments(frame);

  // Turn them into bits
  const input = createInput(segments);

  // Funnel all the data into the processor
  feedProcessor(processor, input);

  // Check we got the expected decode messages
  expect(processor.port.postMessage).toBeCalledTimes(60);

  // Should start with a minute
  expect(processor.port.postMessage).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      msg: "minute",
    })
  );

  // Should have 59 second markers
  for (let call = 2; call <= 60; ++call) {
    expect(processor.port.postMessage).toHaveBeenNthCalledWith(
      call,
      expect.objectContaining({
        msg: "second",
        second: call - 1,
      })
    );
  }

  // Last second should contain full frame
  const expectedFrame: TimeFrame = {
    dut1: frame.dut1,
    summerTimeWarning: frame.summerTimeWarning,
    summerTime: frame.summerTime,
  };
  expect(processor.port.postMessage).toHaveBeenNthCalledWith(
    60,
    expect.objectContaining({
      msg: "second",
      second: 59,
      frame: expect.objectContaining(expectedFrame),
    })
  );
});

test.todo("decode offset frame", () => {});
test.todo("decode frame with failed parity", () => {});
test.todo("decode frame with bad bits", () => {});
test.todo("decode multiple frames", () => {});
