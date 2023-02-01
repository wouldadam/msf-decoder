<script lang="ts">
  import { getContext, onDestroy, onMount } from "svelte";
  import MPause from "svelte-icons/md/MdPause.svelte";
  import MdPlayArrow from "svelte-icons/md/MdPlayArrow.svelte";
  import MdVolumeOff from "svelte-icons/md/MdVolumeOff.svelte";
  import MdVolumeUp from "svelte-icons/md/MdVolumeUp.svelte";
  import { get, type Writable } from "svelte/store";
  import { audio, audioSource, playback, type OnOffState } from "../../config";
  import { defaultProcessorKey, Processor } from "../../processing/Processor";

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
    // to enumerate the audio devices.
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const allDevices = await navigator.mediaDevices.enumerateDevices();
    devices = allDevices.filter((d) => d.kind === "audioinput");
  });

  // Start/stop audio playback
  function togglePlayback() {
    if ($playback === "play") {
      $playback = "pause";
    } else {
      $playback = "play";
    }
  }

  // Toggle an OnOffState
  function toggleOnOffState(state: Writable<OnOffState>) {
    if (get(state) === "on") {
      state.set("off");
    } else {
      state.set("on");
    }
  }

  // Handle selection of a audio file
  function onAudioFile() {
    if (audioFileInput.files.length === 1) {
      $audioSource = audioFileInput.files[0];
    }
  }

  // Format seconds to HH:MM:SS
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
  Controls the selection and playback of an audio source for decoding.
-->
<div class="card card-compact w-full h-full bg-base-200 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Playback</h2>

    <label class="label-text-alt" for="source">Source</label>
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

      <label
        class="tooltip tooltip-bottom"
        data-tip={$audio === "on" ? "Mute" : "Unmute"}
      >
        <button
          class="btn btn-sm p-2 pl-3 pr-3 tooltip tooltip-bottom normal-case"
          on:click={() => toggleOnOffState(audio)}
          data-testid="audio-toggle"
        >
          <label
            class="swap swap-flip"
            class:swap-active={$audio == "on"}
            for="#"
          >
            <div class="swap-on h-4 w-4"><MdVolumeUp /></div>
            <div class="swap-off h-4 w-4"><MdVolumeOff /></div>
          </label>
        </button>
      </label>
    </div>

    <div class="flex flex-row grow gap-4 mt-2">
      <div class="input input-sm">
        {formatTime(audioTime)}
      </div>

      <label
        class="tooltip tooltip-bottom w-full"
        data-tip={$playback === "play" ? "Pause" : "Play"}
      >
        <button
          class="w-full btn btn-sm btn-success"
          class:btn-error={$playback === "play"}
          on:click={togglePlayback}
          data-testid="playback-toggle"
        >
          <label
            class="swap swap-rotate h-full w-full"
            class:swap-active={$playback === "play"}
            for="#"
          >
            <div class="swap-on h-8 w-8"><MPause /></div>
            <div class="swap-off h-8 w-8"><MdPlayArrow /></div>
          </label>
        </button>
      </label>
    </div>
  </div>
</div>
