<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { MSFMsg } from "../worklets/MSFNode";

  export let event: MSFMsg | undefined;
  export let isOpen: boolean;

  const dispatch = createEventDispatcher();

  function formatTime(utcValue?: number) {
    if (utcValue !== undefined) {
      return new Date(utcValue).toISOString();
    }

    return "undefined";
  }

  let fields: Array<{
    type: "section" | "field" | "collapse";
    name: string;
    value?: string;
    classes?: string;
  }> = [];

  $: {
    fields = [
      { type: "section", name: "Time" },
      { type: "field", name: "UTC time", value: formatTime(event?.utcTime) },
      {
        type: "field",
        name: "Audio time (seconds)",
        value: event?.audioTime.toFixed(2),
      },
    ];

    if (event?.msg == "invalid") {
      fields.push(
        { type: "section", name: "Error" },
        {
          type: "field",
          name: "Reason",
          value: event?.reason,
          classes: "font-mono",
        },
        {
          type: "field",
          name: "Bits",
          value: event?.bits,
          classes: "font-mono",
        }
      );
    }

    if (event?.msg === "second" || event?.msg == "invalid") {
      fields.push(
        { type: "section", name: "Frame" },
        { type: "field", name: "Second", value: event?.second.toFixed(2) },
        {
          type: "collapse",
          name: "Data",
          value: JSON.stringify(event?.frame, null, 4),
          classes: "col-span-2 font-mono whitespace-pre",
        }
      );
    }

    if (event?.msg === "sync") {
      fields.push(
        { type: "section", name: "Sync" },
        {
          type: "field",
          name: "Samples",
          value: event?.skipSamples.toFixed(0),
        },
        { type: "field", name: "Max", value: event?.maxCount.toFixed(0) }
      );
    }
  }
</script>

<!--
  @component
  Renders a single event in an a modal.
-->
<div class="modal modal-open" role="dialog" class:modal-open={isOpen}>
  <div class="modal-box">
    <div class="font-bold text-2xl capitalize">{event?.msg} event</div>
    <div class="grid grid-cols-2 gap-2 pt-4">
      {#each fields as field}
        {#if field.type == "section"}
          <div class="col-span-2 font-bold text-xl">{field.name}</div>
        {:else if field.type == "field"}
          <div class="font-bold">{field.name}</div>
          <div class={field.classes}>{field.value}</div>
        {:else if field.type == "collapse"}
          <div class="font-bold">{field.name}</div>
          <div tabindex="-1" class={`collapse collapse-arrow ${field.classes}`}>
            <div class={`collapse-title ${field.classes}`}>Click to expand</div>
            <div class={`collapse-content ${field.classes}`}>{field.value}</div>
          </div>
        {/if}
      {/each}
    </div>

    <div class="modal-action">
      <button class="btn" on:click={() => dispatch("close")}>Close</button>
    </div>
  </div>
</div>
