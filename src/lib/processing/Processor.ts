import {
  get,
  type Readable,
  type Unsubscriber,
  type Writable,
} from "svelte/store";
import type {
  AnalyserConfig,
  ComparatorConfig,
  DisplayMode,
  FilterConfig,
  MSFConfig,
  OnOffState,
  PlaybackState,
  RMSConfig,
} from "../config";
import { ComparatorNode } from "./worklets/ComparatorNode";
import { MSFNode } from "./worklets/MSFNode";
import { RMSNode } from "./worklets/RMSNode";

import type { EventStore, TimeStore } from "../time";
import comparatorProcessorUrl from "./worklets/ComparatorProcessor.ts?worker&url";
import msfProcessorUrl from "./worklets/MSFProcessor.ts?worker&url";
import rmsProcessorUrl from "./worklets/RMSProcessor.ts?worker&url";

/**
 * Manages the processing of a selected audio stream.
 */
export class Processor {
  private unsubAudioSource: Unsubscriber;
  private unsubCarrierFrequency: Unsubscriber;
  private unsubPlayback: Unsubscriber;
  private unsubAudio: Unsubscriber;
  private unsubDisplayMode: Unsubscriber;

  private unsubFilterConfig: Unsubscriber;
  private unsubRMSConfig: Unsubscriber;
  private unsubComparatorConfig: Unsubscriber;
  private unsubMSFConfig: Unsubscriber;
  private unsubAnalyserConfig: Unsubscriber;

  private stream?: MediaStream;
  private source?:
    | MediaStreamAudioSourceNode
    | MediaElementAudioSourceNode
    | AudioBufferSourceNode
    | OscillatorNode;
  private filter?: BiquadFilterNode;
  private rms?: AudioWorkletNode;
  private comparator?: AudioWorkletNode;

  public context?: AudioContext;
  public msf?: MSFNode;
  public analyser?: AnalyserNode;

  constructor(
    private audioSourceStore: Readable<MediaDeviceInfo | File | string | null>,
    private carrierFrequencyStore: Readable<number>,
    private playbackStore: Readable<PlaybackState>,
    private audioStore: Readable<OnOffState>,
    private displayModeStore: Readable<DisplayMode>,
    private filterConfigStore: Readable<FilterConfig>,
    private rmsConfigStore: Readable<RMSConfig>,
    private comparatorConfigStore: Readable<ComparatorConfig>,
    private msfConfigStore: Readable<MSFConfig>,
    private analyserConfigStore: Readable<AnalyserConfig>,
    private timeStore: Writable<TimeStore>,
    private eventStore: Writable<EventStore>
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

    this.unsubFilterConfig = filterConfigStore.subscribe(
      this.updateFilterParams
    );
    this.unsubRMSConfig = rmsConfigStore.subscribe(this.updateRMSParams);
    this.unsubComparatorConfig = comparatorConfigStore.subscribe(
      this.updateComparatorParams
    );
    this.unsubMSFConfig = msfConfigStore.subscribe(this.updateMSFParams);
    this.unsubAnalyserConfig = analyserConfigStore.subscribe(
      this.updateAnalyserParams
    );
  }

  /** Releases resources. The Processor will no longer be usable. */
  public close() {
    this.unsubAudioSource();
    this.unsubCarrierFrequency();
    this.unsubPlayback();
    this.unsubAudio();
    this.unsubDisplayMode();

    this.unsubFilterConfig();
    this.unsubRMSConfig();
    this.unsubComparatorConfig();
    this.unsubMSFConfig();
    this.unsubAnalyserConfig();

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
    this?.rms?.disconnect();
    this?.filter?.disconnect();

    if (this.source instanceof AudioBufferSourceNode) {
      this.source.stop();
    }

    this?.source?.disconnect();
    this?.context?.close();

    this.analyser = null;
    this.msf = null;
    this.comparator = null;
    this.rms = null;
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

    try {
      this.context = new AudioContext();
      await this.context.audioWorklet.addModule(rmsProcessorUrl);
      await this.context.audioWorklet.addModule(comparatorProcessorUrl);
      await this.context.audioWorklet.addModule(msfProcessorUrl);

      if (get(this.playbackStore) === "pause") {
        await this.context.suspend();
      }

      if (audioSource instanceof File) {
        const buffer = await audioSource.arrayBuffer();
        const audioBuffer = await this.context.decodeAudioData(buffer);
        this.source = this.context.createBufferSource();
        this.source.buffer = audioBuffer;
        this.source.loop = true;
        this.source.start();
      } else if (typeof audioSource === "string") {
        const response = await fetch(audioSource, { method: "GET" });
        const audioBuffer = await this.context.decodeAudioData(
          await response.arrayBuffer()
        );
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
      this.filter.frequency.setValueAtTime(
        get(this.carrierFrequencyStore),
        this.context.currentTime
      );
      this.updateFilterParams(get(this.filterConfigStore));
      this.source.connect(this.filter);

      this.rms = new RMSNode(this.context);
      this.updateRMSParams(get(this.rmsConfigStore));
      this.filter.connect(this.rms);

      this.comparator = new ComparatorNode(this.context);
      this.updateComparatorParams(get(this.comparatorConfigStore));
      this.rms.connect(this.comparator);

      this.msf = new MSFNode(this.context, this.timeStore, this.eventStore);
      this.updateMSFParams(get(this.msfConfigStore));
      this.comparator.connect(this.msf);

      this.analyser = this.context.createAnalyser();
      this.updateAnalyserParams(get(this.analyserConfigStore));

      switch (get(this.displayModeStore)) {
        default:
        case "raw":
          this.source.connect(this.analyser);
          break;
        case "filter":
          this.filter.connect(this.analyser);
          break;
        case "rms":
          this?.rms?.connect(this.analyser);
          break;
        case "comparator":
          this.comparator.connect(this.analyser);
          break;
      }
    } catch (err) {
      console.error("Failed to initialize processor", err);
      return;
    }
  }

  private updateFilterParams = (config: FilterConfig) => {
    if (this.filter) {
      this.filter.type = config.type;
      this.filter.Q.setValueAtTime(config.qValue, this.context.currentTime);
    }
  };

  private updateRMSParams = (config: RMSConfig) => {
    if (this.rms) {
      this.rms.parameters
        .get("alpha")
        .setValueAtTime(config.alpha, this.context.currentTime);
    }
  };

  private updateComparatorParams = (config: ComparatorConfig) => {
    if (this.comparator) {
      this.comparator.parameters
        .get("threshold")
        .setValueAtTime(config.threshold, this.context.currentTime);
      this.comparator.parameters
        .get("polarity")
        .setValueAtTime(config.polarity, this.context.currentTime);
    }
  };

  private updateMSFParams = (config: MSFConfig) => {
    if (this.msf) {
      this.msf.parameters
        .get("symbolRate")
        .setValueAtTime(config.symbolRate, this.context.currentTime);
    }
  };

  private updateAnalyserParams = (config: AnalyserConfig) => {
    if (this.analyser) {
      this.analyser.fftSize = config.fftSize;
      this.analyser.smoothingTimeConstant = Math.max(
        0,
        Math.min(1, config.smoothingTimeConstant)
      );

      let minDb = Math.max(-150, Math.min(-31, config.minDecibels));
      if (minDb === this.analyser.maxDecibels) {
        minDb -= 1;
      } else if (minDb > this.analyser.maxDecibels) {
        minDb = Math.min(-31, this.analyser.maxDecibels - 1);
      }
      this.analyser.minDecibels = minDb;

      let maxDb = Math.max(-150, Math.min(0, config.maxDecibels));
      if (maxDb === this.analyser.minDecibels) {
        maxDb += 1;
      } else if (this.analyser.minDecibels > maxDb) {
        minDb = Math.min(0, this.analyser.minDecibels + 1);
      }
      this.analyser.maxDecibels = maxDb;
    }
  };

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
      case "rms":
        this?.rms?.connect(this.analyser);
        break;
      case "comparator":
        this?.comparator?.connect(this.analyser);
        break;
    }
  };
}

export const defaultProcessorKey = Symbol();
