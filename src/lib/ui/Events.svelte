<script lang="ts">
  import { eventStore } from "../time";
  import type { MSFMsg } from "../worklets/MSFNode";
  import Event from "./Event.svelte";

  let modalEvent: MSFMsg | undefined = undefined;
  let isModelOpen = false;

  function toText(event: MSFMsg): string {
    if (event.msg == "minute") {
      return "Found minute marker.";
    } else if (event.msg == "second") {
      return `Valid second (${event.second}).`;
    } else if (event.msg == "invalid") {
      return `Invalid segment (${event.second}): ${event.reason}`;
    } else if (event.msg === "sync") {
      return `Synced by ${event.skipSamples} samples.`;
    }
  }
</script>

<!--
  @component
  Renders a list of events from the event store.
-->
<div class="card h-full card-compact bg-base-200 shadow-xl">
  <div class="h-full w-full absolute card-body ">
    <h2 class="card-title">Events</h2>

    <div
      class="h-full relative font-mono text-xs overflow-y-auto whitespace-nowrap"
    >
      {#if $eventStore.events.length < 1}
        <div>Waiting for events...</div>
      {/if}
      {#each $eventStore.events as event}
        <div>
          <button
            class="overflow-hidden text-ellipsis"
            class:text-warning={event.msg == "invalid"}
            class:text-success={event.msg == "minute"}
            on:click={() => {
              modalEvent = event;
              isModelOpen = true;
            }}
          >
            <strong>[{event.audioTime.toFixed(0)}]</strong>
            {toText(event)}
          </button>
        </div>
      {/each}
    </div>
  </div>

  <Event
    event={modalEvent}
    isOpen={isModelOpen}
    on:close={() => (isModelOpen = false)}
  />
</div>
