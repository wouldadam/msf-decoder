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
