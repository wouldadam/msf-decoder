<script lang="ts">
  import { onDestroy, setContext } from "svelte";
  import {
    audio,
    audioSource,
    carrierFrequencyHz,
    displayMode,
    playback,
  } from "./lib/config";
  import { defaultProcessorKey, Processor } from "./lib/processing/Processor";
  import { eventStore, timeStore } from "./lib/time";
  import Playback from "./lib/ui/config/Playback.svelte";
  import Settings from "./lib/ui/config/Settings.svelte";
  import Scan from "./lib/ui/displays/Scan.svelte";
  import Scope from "./lib/ui/displays/Scope.svelte";
  import Waterfall from "./lib/ui/displays/Waterfall.svelte";
  import Events from "./lib/ui/events/Events.svelte";
  import Frames from "./lib/ui/time/Frames.svelte";
  import Time from "./lib/ui/time/Time.svelte";

  const processor = new Processor(
    audioSource,
    carrierFrequencyHz,
    playback,
    audio,
    displayMode,
    timeStore,
    eventStore
  );

  setContext(defaultProcessorKey, processor);

  onDestroy(() => {
    processor.close();
  });
</script>

<main class="h-full p-4">
  <div
    class="w-full h-full min-h-full flex flex-col lg:h-auto lg:flex-row gap-4"
  >
    <div class="flex flex-col gap-y-4 basis-2/3 order-2 lg:order-1">
      <div class="min-h-[10em] basis-1/6">
        <Scan />
      </div>

      <div class="min-h-[10em] grow">
        <Waterfall />
      </div>

      <div class="min-h-[10em] basis-1/6">
        <Scope />
      </div>
    </div>

    <div class="flex flex-col gap-y-4 basis-1/3 order-1 lg:order-2">
      <div class="shrink">
        <Playback />
      </div>

      <div class="shrink">
        <Settings />
      </div>

      <div class="shrink">
        <Time />
      </div>

      <div class="shrink">
        <Frames />
      </div>

      <div class="min-h-[10em] grow">
        <Events />
      </div>
    </div>
  </div>
</main>
