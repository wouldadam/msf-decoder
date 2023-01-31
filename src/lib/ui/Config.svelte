<script lang="ts">
  import { getContext, onDestroy, onMount } from "svelte";
  import GiComputing from "svelte-icons/gi/GiComputing.svelte";
  import MdGraphicEq from "svelte-icons/md/MdGraphicEq.svelte";
  import MdInput from "svelte-icons/md/MdInput.svelte";
  import MPause from "svelte-icons/md/MdPause.svelte";
  import MdPlayArrow from "svelte-icons/md/MdPlayArrow.svelte";
  import MdShowChart from "svelte-icons/md/MdShowChart.svelte";
  import MdVolumeOff from "svelte-icons/md/MdVolumeOff.svelte";
  import MdVolumeUp from "svelte-icons/md/MdVolumeUp.svelte";
  import { get, type Writable } from "svelte/store";
  import {
    audio,
    audioSource,
    carrierFrequencyHz,
    displayMode,
    playback,
    type DisplayMode,
    type OnOffState,
  } from "../config";
  import { defaultProcessorKey, Processor } from "../processing/Processor";

  let devices: MediaDeviceInfo[] | null = null;
  let audioFileInput: HTMLInputElement | null = null;
  $: if (!($audioSource instanceof File)) {
    if (audioFileInput) {
      audioFileInput.value = "";
    }
  }

  const processor = getContext<Processor>(defaultProcessorKey);
  let audioTime = 0;
  const interval = setInterval(
    () => (audioTime = processor?.context?.currentTime || 0),
    500
  );
  onDestroy(() => clearInterval(interval));

  onMount(async () => {
    // We have to call this first otherwise we don't get given permissions
    // to enumerate the audo devices.
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const allDevices = await navigator.mediaDevices.enumerateDevices();
    devices = allDevices.filter((d) => d.kind === "audioinput");
  });

  const views: Array<{ mode: DisplayMode; tip: string; icon?: any }> = [
    { mode: "raw", tip: "Raw view", icon: MdInput },
    { mode: "filter", tip: "Filter view", icon: MdGraphicEq },
    { mode: "rms", tip: "RMS view", icon: MdShowChart },
    { mode: "comparator", tip: "Comparator view", icon: GiComputing },
  ];

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

  function formatTime(seconds: number): string {
    let hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;

    let minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    return `${hours.toFixed(0).padStart(2, "0")}:${minutes
      .toFixed(0)
      .padStart(2, "0")}:${seconds.toFixed(0).padStart(2, "0")}`;
  }
</script>

<!--
  @component
  Allows configuration of the msf decoder inputs by the user.

  The config is stored in the svelte stores in config.ts.
-->
<div class="card card-compact w-full h-full bg-base-200 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Config</h2>

    <label class="label-text" for="sousrce">Playback</label>
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

      <button
        class="btn btn-sm p-2 pl-3 pr-3 tooltip tooltip-bottom normal-case"
        on:click={() => toggleOnOffState(audio)}
        data-tip={$audio === "on" ? "Mute" : "Unmute"}
      >
        {#if $audio === "on"}
          <MdVolumeUp />
        {:else}
          <MdVolumeOff />
        {/if}
      </button>
    </div>

    <div class="flex flex-row grow gap-4 mt-2">
      <input
        value={formatTime(audioTime)}
        class="input input-sm pointer-events-none text-right w-20"
      />

      <button
        class="grow btn btn-sm btn-success tooltip tooltip-bottom normal-case"
        class:btn-error={$playback === "play"}
        on:click={togglePlayback}
        data-tip={$playback === "play" ? "Pause" : "Play"}
      >
        {#if $playback === "play"}
          <MPause />
        {:else}
          <MdPlayArrow />
        {/if}
      </button>
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
      <div class="btn-group btn-horizontal">
        {#each views as view}
          <button
            class="btn btn-sm p-2 pl-3 pr-3 tooltip tooltip-bottom normal-case"
            class:btn-info={$displayMode === view.mode}
            on:click={() => ($displayMode = view.mode)}
            data-tip={view.tip}
          >
            <svelte:component this={view.icon} />
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>
