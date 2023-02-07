<script lang="ts">
  import { timeStore } from "../../time";
  import { frameView } from "../state";
  import TimeFrame from "./TimeFrame.svelte";
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
          class="tab tab-xs text-opacity-80"
          class:tab-active={$frameView == "previous"}
          on:click={() => ($frameView = "previous")}
        >
          Previous
        </button>
        <button
          class="tab tab-xs text-opacity-80"
          class:tab-active={$frameView == "current"}
          on:click={() => ($frameView = "current")}
        >
          Current
        </button>
      </div>
    </h2>

    {#if $frameView == "current"}
      <TimeFrame frame={$timeStore.currentFrame} second={$timeStore.second} />
    {:else}
      <TimeFrame frame={$timeStore.previousFrame} />
    {/if}
  </div>
</div>
