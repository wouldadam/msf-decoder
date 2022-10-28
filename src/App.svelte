<script lang="ts">
  import Placeholder from "./lib/Placeholder.svelte";
  import Config from "./lib/Config.svelte";
  import Scope from "./lib/Scope.svelte";
  import Scan from "./lib/Scan.svelte";
</script>

<main class="h-full p-4">
  <div class="flex flex-col lg:flex-row w-full h-full gap-4">
    <div class="flex flex-col grow gap-y-4">
      <div>
        <Scan />
      </div>

      <div class="h-full">
        <Placeholder title="Waterfall" />
      </div>

      <div>
        <Scope />
      </div>
    </div>

    <div class="flex flex-col grow gap-y-4">
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
