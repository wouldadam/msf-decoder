import { get, type Readable, type Unsubscriber } from "svelte/store";
import type { OnOffState, PlaybackState } from "./config";
import testProcessorUrl from "./TestProcessor.ts?url";

/**
 * Manages the processing of a selected audio stream.
 */
export class Processor {
  private unsubAudioSource: Unsubscriber;
  private unsubCarrierFrequency: Unsubscriber;
  private unsubPlayback: Unsubscriber;
  private unsubAudio: Unsubscriber;
  private unsubDisplayFilter: Unsubscriber;

  private stream?: MediaStream;
  private source?: MediaStreamAudioSourceNode | AudioBufferSourceNode;
  private filter?: BiquadFilterNode;

  public context?: AudioContext;
  public analyser?: AnalyserNode;

  constructor(
    private audioSourceStore: Readable<MediaDeviceInfo | File | null>,
    private carrierFrequencyStore: Readable<number>,
    private playbackStore: Readable<PlaybackState>,
    private audioStore: Readable<OnOffState>,
    private displayFilterStore: Readable<OnOffState>
  ) {
    this.unsubAudioSource = audioSourceStore.subscribe(
      this.onAudioSourceChange
    );
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
    this.unsubAudioSource();
    this.unsubCarrierFrequency();
    this.unsubPlayback();
    this.unsubAudio();
    this.unsubDisplayFilter();

    this.stop();
  }

  /** Starts the Processor playing. */
  public start() {
    this.stop();
    this.init();
  }

  /** Stops any current playback. */
  public stop() {
    this?.analyser?.disconnect();
    this?.filter?.disconnect();

    if (this.source instanceof AudioBufferSourceNode) {
      this.source.stop();
    }

    this?.source?.disconnect();
    this?.context?.close();

    this.analyser = null;
    this.filter = null;
    this.source = null;
    this.stream = null;
    this.context = null;
  }

  /** Initializes the processor for the first time. */
  private async init() {
    this.stop();

    const audioSource = get(this.audioSourceStore);
    if (!audioSource) {
      return;
    }

    this.context = new AudioContext();
    this.context.audioWorklet.addModule(testProcessorUrl);

    if (get(this.playbackStore) === "pause") {
      this.context.suspend();
    }

    if (audioSource instanceof File) {
      const buffer = await audioSource.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(buffer);
      this.source = this.context.createBufferSource();
      this.source.buffer = audioBuffer;
      this.source.loop = true;
      this.source.start();
    } else {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: audioSource.deviceId },
        video: false,
      });

      this.source = this.context.createMediaStreamSource(this.stream);
    }

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

    if (get(this.displayFilterStore) == "on") {
      this.source.connect(this.filter);
      this.filter.connect(this.analyser);
    } else {
      this.source.connect(this.filter);
      this.source.connect(this.analyser);
    }
  }

  private onAudioSourceChange = (mediaDevice?: MediaDeviceInfo) => {
    this.init();
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
      let a = 2;
    }
  };
}

export const defaultProcessorKey = Symbol();
