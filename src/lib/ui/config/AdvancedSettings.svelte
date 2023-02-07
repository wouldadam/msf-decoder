<script lang="ts">
  import { analyserConfig } from "../../config";
  import { advancedSettingsView } from "../state";

  const stages = [["analyser", "Analyser"]] as const;
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
  {/if}
</div>
