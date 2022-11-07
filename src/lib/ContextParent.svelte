<script lang="ts">
  import { setContext, type ComponentType } from "svelte";

  export let contextKey: any;
  export let contextValue: any;
  export let child: ComponentType;

  setContext(contextKey, contextValue);
</script>

<svelte:component this={child} />
