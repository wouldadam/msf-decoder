<script lang="ts">
  import { onMount } from "svelte";
  import MdPlayArrow from "svelte-icons/md/MdPlayArrow.svelte";
  import MdStop from "svelte-icons/md/MdStop.svelte";
  import MdVolumeOff from "svelte-icons/md/MdVolumeOff.svelte";
  import MdVolumeUp from "svelte-icons/md/MdVolumeUp.svelte";
  import { audio, carrierFrequencyHz, mediaDevice, playback } from "./config";

  let devices: MediaDeviceInfo[] | null = null;

  onMount(async () => {
    // We have to call this first otherwise we don't get give permissions
    // to enumerate the audo devices.
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const allDevices = await navigator.mediaDevices.enumerateDevices();
    devices = allDevices.filter((d) => d.kind === "audioinput");
  });

  function togglePlayback() {
    if ($playback === "play") {
      $playback = "pause";
    } else {
      $playback = "play";
    }
  }

  function toggleAudio() {
    if ($audio === "on") {
      $audio = "off";
    } else {
      $audio = "on";
    }
  }
</script>

<!--
  @component
  Allows configuration of the msf decoder inputs by the user.

  The config is stored in the svelte stores in config.ts.
-->
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
          <option value={device}>{device.label}</option>
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

    <div class="flex flex-row grow gap-4 mt-2">
      <button
        class="grow btn btn-success"
        class:btn-error={$playback === "play"}
        on:click={togglePlayback}
      >
        {#if $playback === "play"}
          <MdStop />
        {:else}
          <MdPlayArrow />
        {/if}
      </button>

      <button class="btn p-2 pl-3 pr-3" on:click={toggleAudio}>
        {#if $audio === "on"}
          <MdVolumeUp />
        {:else}
          <MdVolumeOff />
        {/if}
      </button>
    </div>
  </div>
</div>
