import { get, writable } from "svelte/store";
import { test, vi } from "vitest";
import { ValueState } from "../FrameValue";
import { CreateTimeFrame } from "../TimeFrame";
import {
  MSFNode,
  type InvalidMark,
  type MinuteMark,
  type SecondMark,
} from "./MSFNode";

test("can handle minute mark", () => {
  const currentFrame = CreateTimeFrame();
  currentFrame.hour.val = 10;
  currentFrame.hour.state = ValueState.Valid;

  const timeStore = writable({
    currentTime: CreateTimeFrame(),
    currentFrame,
    previousFrame: CreateTimeFrame(),
    second: 30,
  });
  const eventStore = writable({ events: [] });
  const node = new MSFNode(jest.fn() as any, timeStore, eventStore);

  const ev: MessageEvent<MinuteMark> = {
    ...new Event(""),
    lastEventId: "",
    origin: "",
    source: node.port,
    ports: [node.port],
    initMessageEvent: vi.fn(),
    data: { msg: "minute", audioTime: 10, utcTime: 10 },
  };
  node.port.onmessage(ev);

  expect(get(timeStore).second).toBe(0);
  expect(get(timeStore).currentTime).toStrictEqual(currentFrame);
  expect(get(timeStore).currentFrame).toStrictEqual(CreateTimeFrame());
  expect(get(timeStore).previousFrame).toStrictEqual(currentFrame);

  expect(get(eventStore).events).toContain(ev.data);
});

test("can handle second mark", () => {
  const currentTime = CreateTimeFrame();
  currentTime.minute.state = ValueState.Incomplete;
  const currentFrame = CreateTimeFrame();
  currentTime.minute.state = ValueState.Valid;
  const previousFrame = CreateTimeFrame();
  currentTime.minute.state = ValueState.Complete;

  const timeStore = writable({
    currentTime,
    currentFrame,
    previousFrame,
    second: 0,
  });
  const eventStore = writable({ events: [] });
  const node = new MSFNode(jest.fn() as any, timeStore, eventStore);

  const ev: MessageEvent<SecondMark> = {
    ...new Event(""),
    lastEventId: "",
    origin: "",
    source: node.port,
    ports: [node.port],
    initMessageEvent: vi.fn(),
    data: {
      msg: "second",
      audioTime: 10,
      utcTime: 10,
      frame: CreateTimeFrame(),
      second: 20,
    },
  };
  node.port.onmessage(ev);

  expect(get(timeStore).second).toBe(ev.data.second);
  expect(get(timeStore).currentTime).toStrictEqual(currentTime);
  expect(get(timeStore).currentFrame).toStrictEqual(ev.data.frame);
  expect(get(timeStore).previousFrame).toStrictEqual(previousFrame);

  expect(get(eventStore).events).toContain(ev.data);
});

test("can handle invalid mark", () => {
  const currentTime = CreateTimeFrame();
  currentTime.hour.val = 10;
  currentTime.hour.state = ValueState.Valid;

  const currentFrame = CreateTimeFrame();
  currentFrame.hour.val = 20;
  currentFrame.hour.state = ValueState.Valid;

  const previousFrame = CreateTimeFrame();
  previousFrame.hour.val = 30;
  previousFrame.hour.state = ValueState.Valid;

  const timeStore = writable({
    currentTime,
    currentFrame,
    previousFrame,
    second: 30,
  });
  const eventStore = writable({ events: [] });
  const node = new MSFNode(jest.fn() as any, timeStore, eventStore);

  const ev: MessageEvent<InvalidMark> = {
    ...new Event(""),
    lastEventId: "",
    origin: "",
    source: node.port,
    ports: [node.port],
    initMessageEvent: vi.fn(),
    data: {
      msg: "invalid",
      audioTime: 10,
      utcTime: 10,
      bits: "111",
      reason: "Test error.",
      second: 22,
      frame: CreateTimeFrame(),
    },
  };
  node.port.onmessage(ev);

  expect(get(timeStore).second).toBe(null);
  expect(get(timeStore).currentTime).toStrictEqual(currentTime);
  expect(get(timeStore).currentFrame).toStrictEqual(CreateTimeFrame());
  expect(get(timeStore).previousFrame).toStrictEqual(currentFrame);

  expect(get(eventStore).events).toContain(ev.data);
});
