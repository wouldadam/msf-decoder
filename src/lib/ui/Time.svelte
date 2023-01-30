<script lang="ts">
  import { timeStore } from "../time";
  import TimeFrame from "./TimeFrame.svelte";
</script>

<div class="card card-compact w-full bg-base-200 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Time</h2>

    <TimeFrame frame={$timeStore.currentTime} second={$timeStore.second} />
  </div>
</div>
