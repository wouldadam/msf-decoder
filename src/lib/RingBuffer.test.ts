import { expect, test } from "vitest";
import { RingBuffer } from "./RingBuffer";

const ringBufferCap = 1000;
const bufferSize = 128;

test("should be able to push and pull data", () => {
  const reps = Math.ceil((ringBufferCap / bufferSize) * 5);
  const ring = new RingBuffer(ringBufferCap);
  const input = new Float32Array(bufferSize);
  input.forEach((_, i) => (input[i] = i));

  expect(ring.capacity).toBe(ringBufferCap);

  for (let rep = 0; rep < reps; ++rep) {
    ring.push(input);
    expect(ring.length).toBe(input.length);

    const output = new Float32Array(bufferSize);
    ring.pull(output);
    expect(output).toContain(input);
  }

  expect(ring.length).toBe(0);
});

test("should be able to push all data then pull it", () => {
  const reps = Math.floor(ringBufferCap / bufferSize);
  const ring = new RingBuffer(ringBufferCap);
  const input = new Float32Array(bufferSize);
  input.forEach((_, i) => (input[i] = i));

  for (let rep = 0; rep < reps; ++rep) {
    ring.push(input);
  }

  expect(ring.length).toBe(reps * input.length);

  for (let rep = 0; rep < reps; ++rep) {
    const output = new Float32Array(bufferSize);
    ring.pull(output);
    expect(output).toContain(input);
  }

  expect(ring.length).toBe(0);
});

test("pushing when full causes wrapping", () => {
  const ring = new RingBuffer(ringBufferCap);
  const input = new Float32Array(ringBufferCap);
  input.forEach((_, i) => (input[i] = i));

  // Fill the buffer to capacity
  ring.push(input);
  expect(ring.length).toBe(ringBufferCap);

  // Reverse the next input so we can tell the difference
  input.reverse();
  ring.push(input);

  // Only expect to get the second input back out
  const output = new Float32Array(ringBufferCap);
  ring.pull(output);
  expect(output).toContain(input);

  expect(ring.length).toBe(0);
});

test("pulling too much throws", () => {
  const ring = new RingBuffer(ringBufferCap);

  const output = new Float32Array(bufferSize);

  expect(() => ring.pull(output)).toThrow();
});

test("at peeks data", () => {
  const ring = new RingBuffer(ringBufferCap);

  for (let idx = 0; idx < ringBufferCap; ++idx) {
    ring.push([idx]);
    expect(ring.at(idx)).toBe(idx);
  }

  for (let idx = 0; idx < ringBufferCap; ++idx) {
    ring.push([ringBufferCap - idx]);
    expect(ring.at(idx)).toBe(ringBufferCap - idx);
  }
});

test("at peeks data when wrapped", () => {
  const ring = new RingBuffer(ringBufferCap);

  // Fill the buffer so write is at end
  for (let idx = 0; idx < ringBufferCap; ++idx) {
    ring.push([idx]);
  }

  // Consume first half so read is in middle
  const buff = new Float32Array(ringBufferCap / 2);
  ring.pull(buff);

  // Write half so buffer is full
  for (let idx = 0; idx < ringBufferCap / 2; ++idx) {
    ring.push([idx]);
  }

  // Read an check that the read wraps
  for (let idx = 0; idx < ringBufferCap; ++idx) {
    expect(ring.at(idx)).not.toBeUndefined();
  }
});

test("out of range at throws", () => {
  const ring = new RingBuffer(ringBufferCap);

  expect(() => ring.at(0)).toThrow();
});

test("skip removes data from front", () => {
  const ring = new RingBuffer(ringBufferCap);

  for (let idx = 0; idx < ringBufferCap; ++idx) {
    ring.push([idx]);
  }

  for (let idx = 0; idx < ringBufferCap; ++idx) {
    expect(ring.at(0)).toBe(idx);
    ring.skip(1);
  }
});

test("skipping too much throws", () => {
  const ring = new RingBuffer(ringBufferCap);

  ring.push([1, 2, 3, 4, 5]);

  expect(() => ring.skip(6)).toThrow();
});
