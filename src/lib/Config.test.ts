import { render } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { get } from "svelte/store";
import { carrierFrequencyHz, mediaDevice } from "./config";
import Config from "./Config.svelte";

function setupAudioDevices(devices: MediaDeviceInfo[]) {
  if (!global.navigator.mediaDevices) {
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {},
    });
  }

  global.navigator.mediaDevices.enumerateDevices = jest
    .fn()
    .mockResolvedValue(devices);
  global.navigator.mediaDevices.getUserMedia = jest
    .fn()
    .mockResolvedValue(null);
}

test("should list available audioinput devices", async () => {
  const devices = [
    {
      deviceId: "A",
      groupId: "G",
      kind: "audioinput" as MediaDeviceKind,
      label: "Device A",
      toJSON: jest.fn(),
    },
    {
      deviceId: "F",
      groupId: "G",
      kind: "audiooutput" as MediaDeviceKind,
      label: "Output device",
      toJSON: jest.fn(),
    },
    {
      deviceId: "B",
      groupId: "G",
      kind: "audioinput" as MediaDeviceKind,
      label: "Device B",
      toJSON: jest.fn(),
    },
  ];
  setupAudioDevices(devices);

  const user = userEvent.setup();
  const result = render(Config);

  // Check audioinput only devices are shown
  expect(await result.findAllByRole("option")).toHaveLength(2);

  // Pick an option
  await user.selectOptions(result.getByRole("combobox"), ["Device B"]);

  // Check option was chosen
  expect(get(mediaDevice).deviceId).toBe("B");
});

test("should handle missing audioinput devices", () => {
  setupAudioDevices([]);

  const result = render(Config);

  expect(result.queryByRole("option")).toBeNull();
  expect(result.getByText("No audio devices available."));
});

test("should show current carrier frequency", () => {
  setupAudioDevices([]);

  const result = render(Config);

  expect(result.getByRole("spinbutton")).toHaveValue(get(carrierFrequencyHz));
});

test("should set carrier frequency", async () => {
  setupAudioDevices([]);

  const user = userEvent.setup();
  const result = render(Config);

  const input = result.getByRole("spinbutton");
  await user.clear(input);
  await user.type(input, "3579");

  expect(result.getByRole("spinbutton")).toHaveValue(3579);
  expect(get(carrierFrequencyHz)).toBe(3579);
});
