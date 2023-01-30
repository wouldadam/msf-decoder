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
  import Config from "./lib/ui/Config.svelte";
  import Events from "./lib/ui/Events.svelte";
  import Frames from "./lib/ui/Frames.svelte";
  import Scan from "./lib/ui/Scan.svelte";
  import Scope from "./lib/ui/Scope.svelte";
  import Time from "./lib/ui/Time.svelte";
  import Waterfall from "./lib/ui/Waterfall.svelte";

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
  <div class="flex flex-col lg:flex-row w-full h-full gap-4">
    <div class="flex flex-col grow shrink basis-2/3 gap-y-4">
      <div>
        <Scan />
      </div>

      <div class="h-full">
        <Waterfall />
      </div>

      <div>
        <Scope />
      </div>
    </div>

    <div class="flex flex-col grow shrink basis-1/3 gap-y-4">
      <div>
        <Config />
      </div>

      <div>
        <Time />
      </div>

      <div>
        <Frames />
      </div>

      <div class="h-full">
        <Events />
      </div>
    </div>
  </div>
</main>
