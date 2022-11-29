<script lang="ts">
  import { timeStore } from "../time";
  import TimeFrame from "./TimeFrame.svelte";
</script>

<div class="card w-full bg-base-200 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Frames</h2>

    <h3>Current</h3>
    <TimeFrame frame={$timeStore.currentFrame} second={$timeStore.second} />
    <h3>Previous</h3>
    <TimeFrame frame={$timeStore.previousFrame} />
  </div>
</div>
