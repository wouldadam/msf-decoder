import type { Readable, Unsubscriber } from "svelte/store";
import { mediaDevice } from "./config";

/**
 * Manages the processing of a selected audio stream.
 */
class Processor {
  private unsubscribe: Unsubscriber;

  private mediaDevice?: MediaDeviceInfo;
  private context?: AudioContext;
  private stream?: MediaStream;
  private source?: MediaStreamAudioSourceNode;

  public analyser?: AnalyserNode;

  constructor(mediaDeviceStore: Readable<MediaDeviceInfo | null>) {
    this.unsubscribe = mediaDeviceStore.subscribe(this.onChange);
  }

  /** Releases resources. The Processor will no longer be usable. */
  public close() {
    this.unsubscribe();
    this.source.disconnect();
  }

  /** Initializes the processor for the first time. */
  private async init(mediaDevice: MediaDeviceInfo) {
    this.mediaDevice = mediaDevice;
    this.context = new AudioContext();

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: mediaDevice.deviceId },
      video: false,
    });
    this.source = this.context.createMediaStreamSource(this.stream);
    this.source.connect(this.context.destination);

    this.analyser = this.context.createAnalyser();
    this.analyser.maxDecibels = 0;
    this.analyser.minDecibels = -150;
    this.analyser.fftSize = 4096;
    this.source.connect(this.analyser);
  }

  /** Changes the current media device. */
  private async change(mediaDevice: MediaDeviceInfo) {
    // Same as current device
    if (this.mediaDevice.deviceId === mediaDevice.deviceId) {
      return;
    }

    if (mediaDevice) {
      // Disconnect old source
      this.source.disconnect();
      this.source = null;
      this.stream = null;

      // Create new source
      this.mediaDevice = mediaDevice;
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: mediaDevice.deviceId },
        video: false,
      });
      this.source = this.context.createMediaStreamSource(this.stream);
      this.source.connect(this.context.destination);

      this.source.connect(this.analyser);
    }
  }

  private onChange = (mediaDevice?: MediaDeviceInfo) => {
    if (mediaDevice && !this.context) {
      this.init(mediaDevice);
    } else if (this.context) {
      this.change(mediaDevice);
    }
  };
}

export const defaultProcessor = new Processor(mediaDevice);
