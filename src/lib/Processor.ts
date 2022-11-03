import { get, type Readable, type Unsubscriber } from "svelte/store";
import {
  audio,
  carrierFrequencyHz,
  displayFilter,
  mediaDevice,
  playback,
  type OnOffState,
  type PlaybackState,
} from "./config";

/**
 * Manages the processing of a selected audio stream.
 */
class Processor {
  private unsubMedia: Unsubscriber;
  private unsubCarrierFrequency: Unsubscriber;
  private unsubPlayback: Unsubscriber;
  private unsubAudio: Unsubscriber;
  private unsubDisplayFilter: Unsubscriber;

  private mediaDevice?: MediaDeviceInfo;
  private stream?: MediaStream;
  private source?: MediaStreamAudioSourceNode;
  private filter: BiquadFilterNode;

  public context?: AudioContext;
  public analyser?: AnalyserNode;

  constructor(
    private mediaDeviceStore: Readable<MediaDeviceInfo | null>,
    private carrierFrequencyStore: Readable<number>,
    private playbackStore: Readable<PlaybackState>,
    private audioStore: Readable<OnOffState>,
    private displayFilterStore: Readable<OnOffState>
  ) {
    this.unsubMedia = mediaDeviceStore.subscribe(this.onMediaChange);
    this.unsubCarrierFrequency = carrierFrequencyStore.subscribe(
      this.onCarrierFrequencyChange
    );
    this.unsubPlayback = playbackStore.subscribe(this.onPlaybackChange);
    this.unsubAudio = audioStore.subscribe(this.onAudioChange);
    this.unsubDisplayFilter = displayFilterStore.subscribe(
      this.onDisplayFilterChange
    );
  }

  /** Releases resources. The Processor will no longer be usable. */
  public close() {
    this.unsubMedia();
    this.unsubCarrierFrequency();
    this.unsubPlayback();
    this.unsubAudio();
    this.unsubDisplayFilter();
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

    this.filter = this.context.createBiquadFilter();
    this.filter.type = "bandpass";
    this.filter.Q.setValueAtTime(50, this.context.currentTime);
    this.filter.frequency.setValueAtTime(
      get(this.carrierFrequencyStore),
      this.context.currentTime
    );

    this.analyser = this.context.createAnalyser();
    this.analyser.maxDecibels = 0;
    this.analyser.minDecibels = -150;
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant = 0;

    if (get(displayFilter) == "on") {
      this.source.connect(this.filter);
      this.filter.connect(this.analyser);
    } else {
      this.source.connect(this.filter);
      this.source.connect(this.analyser);
    }
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

  private onCarrierFrequencyChange = (carrierFrequencyHz: number) => {
    this?.filter?.frequency.setValueAtTime(
      carrierFrequencyHz,
      this.context.currentTime
    );
  };

  private onPlaybackChange = (state: PlaybackState) => {
    if (state === "play") {
      this.context?.resume();
    } else {
      this.context?.suspend();
    }
  };

  private onAudioChange = (state: OnOffState) => {
    if (state === "on") {
      this?.source?.connect(this?.context?.destination);
    } else {
      this?.source?.disconnect(this?.context?.destination);
    }
  };

  private onDisplayFilterChange = (state: OnOffState) => {
    if (state == "on") {
      this?.source?.disconnect(this.analyser);

      this?.source?.connect(this.filter);
      this?.filter?.connect(this.analyser);
    } else {
      this?.filter?.disconnect(this.analyser);

      this?.source?.connect(this.filter);
      this?.source?.connect(this.analyser);
    }
  };
}

export const defaultProcessor = new Processor(
  mediaDevice,
  carrierFrequencyHz,
  playback,
  audio,
  displayFilter
);
