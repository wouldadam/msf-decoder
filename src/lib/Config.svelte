<script lang="ts">
  import { onMount } from "svelte";

  import { carrierFrequencyHz, mediaDevice } from "./config";

  let devices: MediaDeviceInfo[] | null = null;

  onMount(async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const allDevices = await navigator.mediaDevices.enumerateDevices();
    devices = allDevices.filter((d) => d.kind === "audioinput");
  });
</script>

<div class="card w-full h-full bg-base-200 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Config</h2>

    {#if devices == null}
      <p>No audio devices available.</p>
    {:else}
      <label class="label-text" for="source">Source</label>
      <select
        class={"select select-sm w-full" +
          (!$mediaDevice ? " select-warning" : "")}
        id="source"
        bind:value={$mediaDevice}
      >
        {#each devices as device}
          <option value={device.deviceId}>{device.label}</option>
        {/each}
      </select>
    {/if}

    <label class="label-text" for="freq">Carrier frequency</label>
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
  </div>
</div>
