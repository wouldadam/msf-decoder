import { get, type Readable, type Unsubscriber } from "svelte/store";
import { ComparatorNode } from "./ComparatorNode";
import comparatorProcessorUrl from "./ComparatorProcessor.ts?url";
import type { DisplayMode, OnOffState, PlaybackState } from "./config";
import { MSFNode } from "./MSFNode";
import msfProcessorUrl from "./MSFProcessor.ts?url";

/**
 * Manages the processing of a selected audio stream.
 */
export class Processor {
  private unsubAudioSource: Unsubscriber;
  private unsubCarrierFrequency: Unsubscriber;
  private unsubPlayback: Unsubscriber;
  private unsubAudio: Unsubscriber;
  private unsubDisplayMode: Unsubscriber;

  private stream?: MediaStream;
  private source?: MediaStreamAudioSourceNode | AudioBufferSourceNode;
  private filter?: BiquadFilterNode;
  private comparator?: AudioWorkletNode;
  private msf?: AudioWorkletNode;

  public context?: AudioContext;
  public analyser?: AnalyserNode;

  constructor(
    private audioSourceStore: Readable<MediaDeviceInfo | File | null>,
    private carrierFrequencyStore: Readable<number>,
    private playbackStore: Readable<PlaybackState>,
    private audioStore: Readable<OnOffState>,
    private displayModeStore: Readable<DisplayMode>
  ) {
    this.unsubAudioSource = audioSourceStore.subscribe(
      this.onAudioSourceChange
    );
    this.unsubCarrierFrequency = carrierFrequencyStore.subscribe(
      this.onCarrierFrequencyChange
    );
    this.unsubPlayback = playbackStore.subscribe(this.onPlaybackChange);
    this.unsubAudio = audioStore.subscribe(this.onAudioChange);
    this.unsubDisplayMode = displayModeStore.subscribe(
      this.onDisplayModeChange
    );
  }

  /** Releases resources. The Processor will no longer be usable. */
  public close() {
    this.unsubAudioSource();
    this.unsubCarrierFrequency();
    this.unsubPlayback();
    this.unsubAudio();
    this.unsubDisplayMode();

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
    this?.msf?.disconnect();
    this?.comparator?.disconnect();
    this?.filter?.disconnect();

    if (this.source instanceof AudioBufferSourceNode) {
      this.source.stop();
    }

    this?.source?.disconnect();
    this?.context?.close();

    this.analyser = null;
    this.msf = null;
    this.comparator = null;
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
    this.context.audioWorklet.addModule(comparatorProcessorUrl);
    this.context.audioWorklet.addModule(msfProcessorUrl);

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
    this.source.connect(this.filter);

    this.comparator = new ComparatorNode(this.context, {
      polarity: "negative",
      thresholdWindowSec: 2,
    });
    this.filter.connect(this.comparator);

    this.msf = new MSFNode(this.context, {
      symbolRate: 10,
    });
    this.msf.port.onmessage = (ev: MessageEvent) => {
      console.debug(ev.data);
    };
    this.comparator.connect(this.msf);

    this.analyser = this.context.createAnalyser();
    this.analyser.maxDecibels = 0;
    this.analyser.minDecibels = -150;
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant = 0;

    switch (get(this.displayModeStore)) {
      default:
      case "raw":
        this.source.connect(this.analyser);
        break;
      case "filter":
        this.filter.connect(this.analyser);
        break;
      case "comparator":
        this.comparator.connect(this.analyser);
        break;
    }
  }

  private onAudioSourceChange = () => {
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

  private onDisplayModeChange = (mode: DisplayMode) => {
    try {
      this?.source?.disconnect(this?.analyser);
    } catch (e: unknown) {}

    try {
      this?.filter?.disconnect(this?.analyser);
    } catch (e: unknown) {}

    try {
      this?.comparator?.disconnect(this?.analyser);
    } catch (e: unknown) {}

    switch (mode) {
      default:
      case "raw":
        this?.source?.connect(this.analyser);
        break;
      case "filter":
        this?.filter?.connect(this.analyser);
        break;
      case "comparator":
        this?.comparator?.connect(this.analyser);
        break;
    }
  };
}

export const defaultProcessorKey = Symbol();
