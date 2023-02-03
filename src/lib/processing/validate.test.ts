import { test } from "vitest";
import { minuteSegment, secondSegment } from "./constants";
import { RingBuffer } from "./RingBuffer";
import {
  areFixedBitsValid,
  isMinuteSegment,
  isSecondSegment,
} from "./validate";

test("isMinuteSegment accepts valid minutes", () => {
  const buffer = new RingBuffer(minuteSegment.length);
  buffer.push(minuteSegment);

  expect(isMinuteSegment(buffer)).toBe(true);
});

test("isMinuteSegment rejects invalid minutes", () => {
  const buffer = new RingBuffer(minuteSegment.length);
  buffer.push([1, 1, 0, 0, 1, 1, 0, 0, 1, 1]);

  expect(isMinuteSegment(buffer)).toBe(false);
});

test("isMinuteSegment rejects buffers that are too small", () => {
  const buffer = new RingBuffer(minuteSegment.length);

  expect(isMinuteSegment(buffer)).toBe(false);
});

test("isSecondSegment accepts valid seconds", () => {
  const buffer = new RingBuffer(secondSegment.length);
  buffer.push(secondSegment);

  expect(isSecondSegment(buffer)).toBe(true);
});

test("isSecondSegment rejects invalid seconds", () => {
  const buffer = new RingBuffer(secondSegment.length);
  buffer.push([1, -1, -1, 0, 0, 0, 0, 0, 0, 1]);

  expect(isSecondSegment(buffer)).toBe(false);
});

test("isSecondSegment rejects buffers that are too small", () => {
  const buffer = new RingBuffer(secondSegment.length);

  expect(isSecondSegment(buffer)).toBe(false);
});

test("areFixedBitsValid accepts any bits for seconds with no fixed bits", () => {
  const buffer = new RingBuffer(secondSegment.length);

  buffer.push([1, -1, -1, 0, 0, 0, 0, 0, 0, 0]);
  expect(areFixedBitsValid(buffer, 1)).toBe(true);

  buffer.reset();
  buffer.push([1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  expect(areFixedBitsValid(buffer, 1)).toBe(true);
});

test("areFixedBitsValid accepts valid bits for seconds with fixed bits", () => {
  const buffer = new RingBuffer(secondSegment.length);
  buffer.push([1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  expect(areFixedBitsValid(buffer, 52)).toBe(true);
});

test("areFixedBitsValid rejects invalid A bits for seconds with fixed bits", () => {
  const buffer = new RingBuffer(secondSegment.length);
  buffer.push([1, 1, 0, 0, 0, 0, 0, 0, 0, 0]);

  expect(areFixedBitsValid(buffer, 52)).toBe(false);
});

test("areFixedBitsValid rejects invalid B bits for seconds with fixed bits", () => {
  const buffer = new RingBuffer(secondSegment.length);
  buffer.push([1, 0, 1, 0, 0, 0, 0, 0, 0, 0]);

  expect(areFixedBitsValid(buffer, 52)).toBe(false);
});
