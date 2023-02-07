<script lang="ts">
  import { onMount } from "svelte";
  import GiComputing from "svelte-icons/gi/GiComputing.svelte";
  import MdGraphicEq from "svelte-icons/md/MdGraphicEq.svelte";
  import MdInput from "svelte-icons/md/MdInput.svelte";
  import MdShowChart from "svelte-icons/md/MdShowChart.svelte";
  import {
    carrierFrequencyHz,
    displayMode,
    type DisplayMode,
  } from "../../config";

  import { themeChange } from "theme-change";

  onMount(async () => {
    themeChange(false);
  });

  const views: Array<{ mode: DisplayMode; tip: string; icon?: any }> = [
    { mode: "raw", tip: "Raw view", icon: MdInput },
    { mode: "filter", tip: "Filter view", icon: MdGraphicEq },
    { mode: "rms", tip: "RMS view", icon: MdShowChart },
    { mode: "comparator", tip: "Comparator view", icon: GiComputing },
  ];
</script>

<!--
  @component
  Allows configuration of the basic msf decoder settings.
-->
<div class="flex flex-col w-full h-full gap-2">
  <label class="label-text-alt" for="freq">Carrier frequency</label>
  <label class="input-group">
    <input
      class="input input-sm w-full"
      id="freq"
      type="number"
      min="0"
      bind:value={$carrierFrequencyHz}
    />
    <span>Hz</span>
  </label>

  <div class="flex flex-row grow gap-2 mt-2 justify-between">
    <div class="btn-group btn-horizontal">
      {#each views as view}
        <button
          class="btn btn-sm p-2 pl-3 pr-3 tooltip tooltip-bottom normal-case"
          class:btn-info={$displayMode === view.mode}
          on:click={() => ($displayMode = view.mode)}
          aria-label={view.tip}
          data-tip={view.tip}
        >
          <svelte:component this={view.icon} />
        </button>
      {/each}
    </div>

    <select
      class="select select-sm grow"
      aria-label="Theme select"
      data-choose-theme
    >
      <option value="default">Default</option>

      <optgroup label="Light">
        <option value="light">Light</option>
        <option value="cupcake">Cupcake</option>
        <option value="emerald">Emerald</option>
        <option value="corporate">Corporate</option>
        <option value="lofi">Lofi</option>
      </optgroup>

      <optgroup label="Dark">
        <option value="dark">Dark</option>
        <option value="halloween">Halloween</option>
        <option value="dracula">Dracula</option>
        <option value="night">Night</option>
        <option value="retro">Retro</option>
      </optgroup>

      <optgroup label="Novelty">
        <option value="cyberpunk">Cyberpunk</option>
        <option value="wireframe">Wireframe</option>
        <option value="synthwave">Synthwave</option>
        <option value="aqua">Aqua</option>
      </optgroup>
    </select>
  </div>
</div>
