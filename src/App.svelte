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
  import Config from "./lib/ui/Config.svelte";
  import Placeholder from "./lib/ui/Placeholder.svelte";
  import Scan from "./lib/ui/Scan.svelte";
  import Scope from "./lib/ui/Scope.svelte";
  import Waterfall from "./lib/ui/Waterfall.svelte";

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
