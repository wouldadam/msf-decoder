import {
  get,
  type Readable,
  type Unsubscriber,
  type Writable,
} from "svelte/store";
import type { DisplayMode, OnOffState, PlaybackState } from "../config";
import { ComparatorNode } from "../worklets/ComparatorNode";
import { MSFNode } from "../worklets/MSFNode";
import { RMSNode } from "../worklets/RMSNode";

import type { EventStore, TimeStore } from "../time";
import comparatorProcessorUrl from "../worklets/ComparatorProcessor.ts?url";
import msfProcessorUrl from "../worklets/MSFProcessor.ts?url";
import rmsProcessorUrl from "../worklets/RMSProcessor.ts?url";

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
  private source?:
    | MediaStreamAudioSourceNode
    | AudioBufferSourceNode
    | OscillatorNode;
  private filter?: BiquadFilterNode;
  private rms?: AudioWorkletNode;
  private comparator?: AudioWorkletNode;

  public context?: AudioContext;
  public msf?: MSFNode;
  public analyser?: AnalyserNode;

  constructor(
    private audioSourceStore: Readable<MediaDeviceInfo | File | null>,
    private carrierFrequencyStore: Readable<number>,
    private playbackStore: Readable<PlaybackState>,
    private audioStore: Readable<OnOffState>,
    private displayModeStore: Readable<DisplayMode>,
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

    this.context = new AudioContext();
    this.context.audioWorklet.addModule(rmsProcessorUrl);
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
    this.filter.Q.setValueAtTime(1, this.context.currentTime);
    this.filter.frequency.setValueAtTime(
      get(this.carrierFrequencyStore),
      this.context.currentTime
    );
    this.source.connect(this.filter);

    this.rms = new RMSNode(this.context, {
      alpha: 0.15,
    });
    this.filter.connect(this.rms);

    this.comparator = new ComparatorNode(this.context, {
      polarity: "negative",
      threshold: 0.05,
    });
    this.rms.connect(this.comparator);

    this.msf = new MSFNode(
      this.context,
      {
        symbolRate: 10,
      },
      this.timeStore,
      this.eventStore
    );
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
      case "rms":
        this?.rms?.connect(this.analyser);
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
