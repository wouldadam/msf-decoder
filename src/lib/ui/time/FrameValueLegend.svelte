<script lang="ts">
  import MdHelpOutline from "svelte-icons/md/MdHelpOutline.svelte";

  const items = [
    ["bg-base-content", "Awaiting bits"],
    ["bg-warning", "Partial bits received"],
    ["bg-info", "All bits received"],
    ["bg-success", "Validation complete"],
    ["bg-error", "Validation failed"],
  ];
</script>

<!--
  @component
  Display the meaning of FrameValue colors in a hover-over.
-->
<div class="dropdown dropdown-hover dropdown-left">
  <label
    class="btn btn-circle btn-sm btn-ghost no-animation p-1"
    tabindex="-1"
    for="#"
  >
    <MdHelpOutline />
  </label>

  <div
    tabindex="-1"
    class="dropdown-content card card-compact shadow bg-base-100 text-base-content mr-1"
  >
    <div class="card-body flex flex-col md:flex-row gap-4">
      {#each items as item}
        <div class="flex gap-2 justify-items-center">
          <div class={`${item[0]} badge badge-s`} />
          <span class="whitespaces">{item[1]}</span>
        </div>
      {/each}
    </div>
  </div>
</div>
