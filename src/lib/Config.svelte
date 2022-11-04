<script lang="ts">
  import { onMount } from "svelte";
  import MdGraphicEq from "svelte-icons/md/MdGraphicEq.svelte";
  import MdPlayArrow from "svelte-icons/md/MdPlayArrow.svelte";
  import MdStop from "svelte-icons/md/MdStop.svelte";
  import MdVolumeOff from "svelte-icons/md/MdVolumeOff.svelte";
  import MdVolumeUp from "svelte-icons/md/MdVolumeUp.svelte";
  import { get, type Writable } from "svelte/store";
  import {
    audio,
    audioSource,
    carrierFrequencyHz,
    displayFilter,
    playback,
    type OnOffState,
  } from "./config";

  let devices: MediaDeviceInfo[] | null = null;
  let audioFileInput: HTMLInputElement | null = null;
  $: if (!($audioSource instanceof File)) {
    audioFileInput.value = "";
  }

  onMount(async () => {
    // We have to call this first otherwise we don't get given permissions
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

  function toggleOnOffState(state: Writable<OnOffState>) {
    if (get(state) === "on") {
      state.set("off");
    } else {
      state.set("on");
    }
  }

  function onAudioFile(event: Event) {
    if (audioFileInput.files.length === 1) {
      $audioSource = audioFileInput.files[0];
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

    <label class="label-text" for="source">Source</label>
    <div class="flex flex-row gap-2" id="source">
      {#if devices == null}
        <p>No audio devices available.</p>
      {:else}
        <div class="w-full">
          <select
            class={"select select-sm w-full"}
            class:select-warning={!$audioSource}
            bind:value={$audioSource}
          >
            {#each devices as device}
              <option value={device}>{device.label}</option>
            {/each}

            {#if $audioSource instanceof File}
              <option value={$audioSource}>{$audioSource.name}</option>
            {/if}
          </select>
        </div>
      {/if}

      <label class="btn btn-sm" for="audioFile">...</label>
      <input
        id="audioFile"
        class="hidden"
        type="file"
        accept="audio/*"
        bind:this={audioFileInput}
        on:change={onAudioFile}
      />
    </div>

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

    <div class="flex flex-row grow gap-2 mt-2">
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

      <button
        class="btn p-2 pl-3 pr-3"
        class:btn-info={$displayFilter === "on"}
        on:click={() => toggleOnOffState(displayFilter)}
      >
        <MdGraphicEq />
      </button>

      <button
        class="btn p-2 pl-3 pr-3"
        on:click={() => toggleOnOffState(audio)}
      >
        {#if $audio === "on"}
          <MdVolumeUp />
        {:else}
          <MdVolumeOff />
        {/if}
      </button>
    </div>
  </div>
</div>
