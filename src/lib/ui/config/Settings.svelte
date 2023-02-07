<script lang="ts">
  import { settingsView } from "../state";
  import AdvancedSettings from "./AdvancedSettings.svelte";
  import BasicSettings from "./BasicSettings.svelte";
</script>

<!--
  @component
  Allows configuration of the msf decoder inputs by the user.
-->
<div class="card card-compact w-full h-full bg-base-200 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">
      Settings
      <div class="tabs tabs-boxed pb-0">
        <button
          class="tab tab-xs text-opacity-80"
          class:tab-active={$settingsView == "basic"}
          on:click={() => ($settingsView = "basic")}
        >
          Basic
        </button>
        <button
          class="tab tab-xs text-opacity-80"
          class:tab-active={$settingsView == "advanced"}
          on:click={() => ($settingsView = "advanced")}
        >
          Advanced
        </button>
      </div>
    </h2>

    {#if $settingsView == "basic"}
      <BasicSettings />
    {:else}
      <AdvancedSettings />
    {/if}
  </div>
</div>
