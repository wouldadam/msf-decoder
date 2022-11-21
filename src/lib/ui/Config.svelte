<script lang="ts">
  import { onMount } from "svelte";
  import GiComputing from "svelte-icons/gi/GiComputing.svelte";
  import MdGraphicEq from "svelte-icons/md/MdGraphicEq.svelte";
  import MdInput from "svelte-icons/md/MdInput.svelte";
  import MdPlayArrow from "svelte-icons/md/MdPlayArrow.svelte";
  import MdShowChart from "svelte-icons/md/MdShowChart.svelte";
  import MdStop from "svelte-icons/md/MdStop.svelte";
  import MdVolumeOff from "svelte-icons/md/MdVolumeOff.svelte";
  import MdVolumeUp from "svelte-icons/md/MdVolumeUp.svelte";
  import { get, type Writable } from "svelte/store";
  import {
    audio,
    audioSource,
    carrierFrequencyHz,
    displayMode,
    playback,
    type OnOffState,
  } from "../config";

  let devices: MediaDeviceInfo[] | null = null;
  let audioFileInput: HTMLInputElement | null = null;
  $: if (!($audioSource instanceof File)) {
    if (audioFileInput) {
      audioFileInput.value = "";
    }
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

  function onAudioFile() {
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
        class="grow btn btn-sm btn-success"
        class:btn-error={$playback === "play"}
        on:click={togglePlayback}
      >
        {#if $playback === "play"}
          <MdStop />
        {:else}
          <MdPlayArrow />
        {/if}
      </button>

      <div class="btn-group btn-horizontal">
        <button
          class="btn btn-sm p-2 pl-3 pr-3"
          class:btn-info={$displayMode === "raw"}
          on:click={() => ($displayMode = "raw")}
        >
          <MdInput />
        </button>

        <button
          class="btn btn-sm p-2 pl-3 pr-3"
          class:btn-info={$displayMode === "filter"}
          on:click={() => ($displayMode = "filter")}
        >
          <MdGraphicEq />
        </button>

        <button
          class="btn btn-sm p-2 pl-3 pr-3"
          class:btn-info={$displayMode === "rms"}
          on:click={() => ($displayMode = "rms")}
        >
          <MdShowChart />
        </button>

        <button
          class="btn btn-sm p-2 pl-3 pr-3"
          class:btn-info={$displayMode === "comparator"}
          on:click={() => ($displayMode = "comparator")}
        >
          <GiComputing />
        </button>
      </div>

      <button
        class="btn btn-sm p-2 pl-3 pr-3"
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
