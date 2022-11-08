<script lang="ts">
  import { onDestroy, setContext } from "svelte";
  import {
    audio,
    audioSource,
    carrierFrequencyHz,
    displayMode,
    playback,
  } from "./lib/config";
  import Config from "./lib/Config.svelte";
  import Placeholder from "./lib/Placeholder.svelte";
  import { defaultProcessorKey, Processor } from "./lib/Processor";
  import Scan from "./lib/Scan.svelte";
  import Scope from "./lib/Scope.svelte";
  import Waterfall from "./lib/Waterfall.svelte";

  const processor = new Processor(
    audioSource,
    carrierFrequencyHz,
    playback,
    audio,
    displayMode
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

      <div class="h-full">
        <Placeholder title="Decode" />
      </div>

      <div>
        <Placeholder title="Demod" />
      </div>

      <div>
        <Placeholder title="Advanced" />
      </div>
    </div>
  </div>
</main>
