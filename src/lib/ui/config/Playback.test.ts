import { render } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { defaultProcessorKey } from "src/lib/processing/Processor";
import { get } from "svelte/store";
import { expect, test, vi } from "vitest";
import ContextParent from "../../../test/ContextParent.svelte";
import { audio, audioSource, playback } from "../../config";
import Playback from "./Playback.svelte";

function setupAudioDevices(devices: MediaDeviceInfo[]) {
  if (!global.navigator.mediaDevices) {
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {},
    });
  }

  global.navigator.mediaDevices.enumerateDevices = vi
    .fn()
    .mockResolvedValue(devices);
  global.navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(null);
}

test("should list available audioinput devices", async () => {
  const devices = [
    {
      deviceId: "A",
      groupId: "G",
      kind: "audioinput" as MediaDeviceKind,
      label: "Device A",
      toJSON: vi.fn(),
    },
    {
      deviceId: "F",
      groupId: "G",
      kind: "audiooutput" as MediaDeviceKind,
      label: "Output device",
      toJSON: vi.fn(),
    },
    {
      deviceId: "B",
      groupId: "G",
      kind: "audioinput" as MediaDeviceKind,
      label: "Device B",
      toJSON: vi.fn(),
    },
  ];
  setupAudioDevices(devices);

  const user = userEvent.setup();
  const result = render(Playback);

  // Check audioinput devices are shown
  for (const device of devices) {
    if (device.kind === "audioinput") {
      expect(await result.findByText(device.label)).not.toBeNull();
    }
  }

  // Pick an option
  await user.selectOptions(result.getByRole("combobox"), ["Device B"]);

  // Check option was chosen
  expect(get(audioSource)).toHaveProperty("deviceId", "B");
});

test("should handle missing audioinput devices", async () => {
  setupAudioDevices([]);

  const result = render(Playback);

  expect(result.getByText("No audio devices available."));
});

test("should handle play", async () => {
  setupAudioDevices([]);

  const user = userEvent.setup();
  const result = render(Playback);

  const toggle = result.getByTestId("playback-toggle");

  playback.set("pause");

  await user.click(toggle);
  expect(get(playback)).toBe("play");
  expect(toggle.parentElement.getAttribute("data-tip")).toBe("Pause");
});

test("should handle pause", async () => {
  setupAudioDevices([]);

  const user = userEvent.setup();
  const result = render(Playback);

  const toggle = result.getByTestId("playback-toggle");

  playback.set("play");

  await user.click(toggle);
  expect(get(playback)).toBe("pause");
  expect(toggle.parentElement.getAttribute("data-tip")).toBe("Play");
});

test("should handle mute", async () => {
  setupAudioDevices([]);

  const user = userEvent.setup();
  const result = render(Playback);

  const toggle = result.getByTestId("audio-toggle");

  audio.set("on");

  await user.click(toggle);
  expect(get(audio)).toBe("off");
  expect(toggle.parentElement.getAttribute("data-tip")).toBe("Unmute");
});

test("should handle unmute", async () => {
  setupAudioDevices([]);

  const user = userEvent.setup();
  const result = render(Playback);

  const toggle = result.getByTestId("audio-toggle");

  audio.set("off");

  await user.click(toggle);
  expect(get(audio)).toBe("on");
  expect(toggle.parentElement.getAttribute("data-tip")).toBe("Mute");
});

test("should show time of zero when no audio context", async () => {
  setupAudioDevices([]);
  vi.useFakeTimers();

  const result = render(Playback);

  await vi.advanceTimersByTime(1000);
  const time = result.queryByText("00:00:00");

  expect(time).not.toBeNull();
});

test("should show audio context time", async () => {
  setupAudioDevices([]);
  vi.useFakeTimers();

  const processor = {
    context: {
      currentTime: 15,
    },
  };

  const result = render(ContextParent, {
    props: {
      contextKey: defaultProcessorKey,
      contextValue: processor,
      child: Playback,
    },
  });

  await vi.advanceTimersByTime(1000);
  const time = result.queryByText("00:00:15");

  expect(time).not.toBeNull();
});
