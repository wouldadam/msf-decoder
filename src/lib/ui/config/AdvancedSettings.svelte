<script lang="ts">
  import {
    analyserConfig,
    comparatorConfig,
    filterConfig,
    msfConfig,
    rmsConfig,
  } from "../../config";
  import {
    negativePolarityFlag,
    positivePolarityFlag,
  } from "../../processing/worklets/ComparatorNode";
  import { advancedSettingsView } from "../state";

  const stages = [
    ["analyser", "Analyser"],
    ["filter", "Filter"],
    ["rms", "RMS"],
    ["comp", "Comp"],
    ["decode", "Decode"],
  ] as const;
</script>

<!--
  @component
  Allows configuration of the advanced msf decoder settings.
-->
<div class="flex flex-col w-full h-full gap-2">
  <div class="tabs w-full">
    {#each stages as stage}
      <button
        class="tab tab-bordered tab-xs grow"
        class:tab-active={$advancedSettingsView === stage[0]}
        on:click={() => ($advancedSettingsView = stage[0])}
      >
        {stage[1]}
      </button>
    {/each}
  </div>

  {#if $advancedSettingsView == "analyser"}
    <div class="flex flex-row gap-2">
      <div class="basis-1/2">
        <label class="label label-text-alt" for="analyser-fft-size"
          >FFT size</label
        >
        <div
          class="tooltip w-full"
          data-tip="Window size in samples that is used when performing an FFT."
        >
          <select
            class="select select-sm grow w-full"
            id="analyser-fft-size"
            bind:value={$analyserConfig.fftSize}
          >
            {#each [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768] as val}
              <option value={val}>{val}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="basis-1/2">
        <label class="label label-text-alt" for="analyser-smoothing"
          >Smoothing time constant</label
        >
        <div
          class="tooltip w-full"
          data-tip="Averaging constant with the last analysis frame. Basically an average between the current buffer and the last buffer."
        >
          <input
            class="input input-sm w-full"
            id="analyser-smoothing"
            type="number"
            min="0"
            max="1"
            bind:value={$analyserConfig.smoothingTimeConstant}
          />
        </div>
      </div>
    </div>

    <div class="flex flex-row gap-4">
      <div>
        <label class="label label-text-alt" for="analyser-min-db">Min</label>
        <div
          class="tooltip"
          data-tip="Min power value in the scaling range for the FFT."
        >
          <div class="input-group">
            <input
              class="input input-sm w-full"
              id="analyser min dB"
              type="number"
              max="0"
              bind:value={$analyserConfig.minDecibels}
            />
            <span>dB</span>
          </div>
        </div>
      </div>

      <div>
        <label class="label label-text-alt" for="analyser-max-db">Max</label>
        <div
          class="tooltip"
          data-tip="Max power value in the scaling range for the FFT."
        >
          <div class="input-group">
            <input
              class="input input-sm w-full"
              id="analyser-max-db"
              type="number"
              max="0"
              bind:value={$analyserConfig.maxDecibels}
            />
            <span>dB</span>
          </div>
        </div>
      </div>
    </div>
  {:else if $advancedSettingsView == "filter"}
    <div class="flex flex-row gap-2">
      <div class="basis-1/2">
        <label class="label label-text-alt" for="filter-type">Type</label>
        <select
          class="select select-sm w-full"
          id="filter-type"
          bind:value={$filterConfig.type}
        >
          <option value="bandpass">Bandpass</option>
          <option value="lowpass">Lowpass</option>
          <option value="highpass">Highpass</option>
          <option value="allpass">Allpass</option>
          <option value="lowshelf">Lowshelf</option>
          <option value="highshelf">Highshelf</option>
          <option value="notch">Notch</option>
          <option value="peaking">Peaking</option>
        </select>
      </div>

      <div class="basis-1/2">
        <label class="label label-text-alt" for="filter-q-value">Q-value</label>
        <input
          class="input input-sm w-full"
          id="filter-q-value"
          type="number"
          min="0"
          max="1"
          bind:value={$filterConfig.qValue}
        />
      </div>
    </div>
  {:else if $advancedSettingsView == "rms"}
    <div class="flex flex-col gap-2">
      <div>
        <label class="label label-text-alt" for="rms-alpha">Alpha</label>
        <input
          class="input input-sm w-full spin"
          id="rms-alpha"
          type="number"
          min="0"
          max="1"
          bind:value={$rmsConfig.alpha}
        />
      </div>
    </div>
  {:else if $advancedSettingsView == "comp"}
    <div class="flex flex-row gap-2">
      <div class="basis-1/2">
        <label class="label label-text-alt" for="comp-polarity">Polarity</label>
        <select
          class="select select-sm w-full"
          id="comp-polarity"
          bind:value={$comparatorConfig.polarity}
        >
          <option value={positivePolarityFlag}>Positive</option>
          <option value={negativePolarityFlag}>Negative</option>
        </select>
      </div>

      <div class="basis-1/2">
        <label class="label label-text-alt" for="comp-threshold"
          >Threshold</label
        >
        <input
          class="input input-sm w-full"
          id="comp-threshold"
          type="number"
          min="0"
          max="1"
          bind:value={$comparatorConfig.threshold}
        />
      </div>
    </div>
  {:else if $advancedSettingsView == "decode"}
    <div class="flex flex-col gap-2">
      <div>
        <label class="label label-text-alt" for="decode-symbol-rate"
          >Symbol rate</label
        >
        <input
          class="input input-sm w-full"
          id="decode-symbol-rate"
          type="number"
          min="0"
          max="10"
          bind:value={$msfConfig.symbolRate}
        />
      </div>
    </div>
  {/if}
</div>
