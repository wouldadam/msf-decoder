<script lang="ts">
  import {
    ValueState,
    type FrameValue as FrameValueObj,
  } from "../../processing/FrameValue";
  import { DayOfWeek, type TimeFrame } from "../../processing/TimeFrame";
  import FrameValue from "./FrameValue.svelte";

  export let frame: TimeFrame;
  export let second: number | null = null;

  const boolToChar = (value: FrameValueObj<boolean>) => {
    if (value === undefined) {
      return undefined;
    }

    return {
      ...value,
      val: value.val ? "✓" : "✗",
    };
  };

  $: dayOfWeek = {
    ...frame.dayOfWeek,
    val: Object.values(DayOfWeek)[frame.dayOfWeek.val],
  };

  $: flags = [
    {
      title: "DUT1",
      value: frame.dut1,
      desc: "UT1 - UTC.",
    },
    {
      title: "BST warn",
      value: boolToChar(frame.summerTimeWarning),
      desc: "BST change imminent.",
    },
    {
      title: "BST",
      value: boolToChar(frame.summerTime),
      desc: "BST in effect.",
    },
  ];
</script>

<!--
  @component
  Displays a TimeFrame from MSF.
-->
<div class="@container w-full h-full flex flex-col gap-2">
  <div
    class="bg-base-100 w-full rounded-xl flex flex-col @xl:flex-row px-4 text-4xl font-extrabold font-mono"
  >
    <div class="flex flex-row flex-wrap @xl:w-4/6 pt-2 @xl:pt-2 justify-center">
      <div>
        <FrameValue value={frame.year} />
      </div>

      <div>/</div>

      <div>
        <FrameValue value={frame.month} />
      </div>

      <div>/</div>

      <div>
        <FrameValue value={frame.dayOfMonth} />
      </div>

      <div>&nbsp;</div>

      <div>
        <FrameValue value={dayOfWeek} padWidth={1} />
      </div>
    </div>

    <div class="divider divider-vertical @xl:divider-horizontal py-0 my-0" />

    <div class="flex flex-row @xl:w-2/6 pb-2 @xl:p-2 justify-center">
      <FrameValue value={frame.hour} />
      <span>:</span>
      <FrameValue value={frame.minute} />
      {#if second !== null}
        <span>:</span>
        <FrameValue
          value={{ val: second, state: ValueState.Valid, bitCount: 0 }}
        />
      {/if}
    </div>
  </div>

  <div class="bg-base-100 rounded-xl w-full flex flex-row px-4">
    {#each flags as flag, idx}
      <div
        class="tooltip tooltip-bottom basis-1/3 flex flex-row py-1 gap-4 justify-around"
        data-tip={flag.desc}
      >
        <span class="flex whitespace-nowrap items-center opacity-60"
          >{flag.title}</span
        >
        <div class="flex items-center text-2xl font-extrabold">
          <FrameValue value={flag.value} padWidth={1} />
        </div>
      </div>

      {#if idx != flags.length - 1}
        <div class="divider divider-horizontal " />
      {/if}
    {/each}
  </div>
</div>
