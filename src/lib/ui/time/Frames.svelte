<script lang="ts">
  import { timeStore } from "../../time";
  import TimeFrame from "./TimeFrame.svelte";

  let isCurrent = true;
</script>

<!--
  @component
  Displays previous and current frames in tabs.
-->
<div class="card card-compact w-full bg-base-200 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">
      Frames
      <div class="tabs tabs-boxed pb-0">
        <button
          class="tab tab-xs"
          class:tab-active={!isCurrent}
          on:click={() => (isCurrent = false)}
        >
          Previous
        </button>
        <button
          class="tab tab-xs"
          class:tab-active={isCurrent}
          on:click={() => (isCurrent = true)}
        >
          Current
        </button>
      </div>
    </h2>

    {#if isCurrent}
      <TimeFrame frame={$timeStore.currentFrame} second={$timeStore.second} />
    {:else}
      <TimeFrame frame={$timeStore.previousFrame} />
    {/if}
  </div>
</div>
