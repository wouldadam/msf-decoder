<script lang="ts">
  import { timeStore } from "../../time";
  import FrameValueLegend from "./FrameValueLegend.svelte";
  import TimeFrame from "./TimeFrame.svelte";

  const items = [
    ["bg-base-content", "Awaiting bits"],
    ["bg-warning", "Partial bits received"],
    ["bg-info", "All bits received"],
    ["bg-success", "Validation success"],
    ["bg-error", "Validation failed"],
  ];
</script>

<!--
  @component
  Displays the current time.
-->
<div class="card card-compact w-full bg-base-200 shadow-xl">
  <div class="card-body">
    <div class="flex justify-between">
      <h2 class="card-title">Time</h2>

      <FrameValueLegend />
    </div>

    <TimeFrame frame={$timeStore.currentTime} second={$timeStore.second} />
  </div>
</div>
