<script lang="ts">
  import Placeholder from "./lib/Placeholder.svelte";
</script>

<main class="h-full p-4 bg">
  <div class="flex flex-col lg:flex-row w-full h-full gap-4">
    <div class="flex flex-col grow gap-y-4">
      <div>
        <Placeholder title="Scan" />
      </div>
      <div class="h-full w-full">
        <Placeholder title="Waterfall" />
      </div>

      <div>
        <Placeholder title="Scope" />
      </div>
    </div>

    <div class="flex flex-col grow gap-y-4">
      <Placeholder title="Source select" />
      <Placeholder title="Frequency select" />
      <Placeholder title="Decode" />
      <Placeholder title="Demod" />
      <Placeholder title="Advanced" />
    </div>
  </div>
</main>
