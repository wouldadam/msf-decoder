import { get, type Readable, type Unsubscriber } from "svelte/store";
import {
  audio,
  mediaDevice,
  playback,
  type AudioState,
  type PlaybackState,
} from "./config";

/**
 * Manages the processing of a selected audio stream.
 */
class Processor {
  private unsubMedia: Unsubscriber;
  private unsubPlayback: Unsubscriber;
  private unsubAudio: Unsubscriber;

  private mediaDevice?: MediaDeviceInfo;
  private stream?: MediaStream;
  private source?: MediaStreamAudioSourceNode;

  public context?: AudioContext;
  public analyser?: AnalyserNode;

  constructor(
    private mediaDeviceStore: Readable<MediaDeviceInfo | null>,
    private playbackStore: Readable<PlaybackState>,
    private audioStore: Readable<AudioState>
  ) {
    this.unsubMedia = mediaDeviceStore.subscribe(this.onMediaChange);
    this.unsubPlayback = playbackStore.subscribe(this.onPlaybackChange);
    this.unsubAudio = audioStore.subscribe(this.onAudioChange);
  }

  /** Releases resources. The Processor will no longer be usable. */
  public close() {
    this.unsubMedia();
    this.unsubPlayback();
    this.unsubAudio();
    this.source.disconnect();
  }

  /** Initializes the processor for the first time. */
  private async init(mediaDevice: MediaDeviceInfo) {
    this.mediaDevice = mediaDevice;
    this.context = new AudioContext();

    if (get(this.playbackStore) === "pause") {
      this.context.suspend();
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: mediaDevice.deviceId },
      video: false,
    });
    this.source = this.context.createMediaStreamSource(this.stream);

    if (get(this.audioStore) === "on") {
      this.source.connect(this.context.destination);
    }

    this.analyser = this.context.createAnalyser();
    this.analyser.maxDecibels = 0;
    this.analyser.minDecibels = -150;
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant;
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

  private onMediaChange = (mediaDevice?: MediaDeviceInfo) => {
    if (mediaDevice && !this.context) {
      this.init(mediaDevice);
    } else if (this.context) {
      this.change(mediaDevice);
    }
  };

  private onPlaybackChange = (state: PlaybackState) => {
    if (state === "play") {
      this.context?.resume();
    } else {
      this.context?.suspend();
    }
  };

  private onAudioChange = (state: AudioState) => {
    if (state === "on") {
      this?.source?.connect(this?.context?.destination);
    } else {
      this?.source?.disconnect(this?.context?.destination);
    }
  };
}

export const defaultProcessor = new Processor(mediaDevice, playback, audio);
