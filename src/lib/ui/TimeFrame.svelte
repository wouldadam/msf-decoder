<script lang="ts">
  import {
    DayOfWeek,
    ValueState,
    type FrameValue as FrameValueObj,
    type TimeFrame,
  } from "../processing/msf";
  import FrameValue from "./FrameValue.svelte";

  export let frame: TimeFrame;
  export let second: number | null = null;

  $: dayOfWeek = {
    ...frame.dayOfWeek,
    val:
      frame.dayOfWeek !== undefined
        ? Object.values(DayOfWeek)[frame.dayOfWeek.val]
        : undefined,
  };

  $: summerTimeWarning = boolToChar(frame.summerTimeWarning);
  $: summerTime = boolToChar(frame.summerTime);

  const boolToChar = (value: FrameValueObj<boolean>) => {
    if (value === undefined) {
      return undefined;
    }

    return {
      ...value,
      val: value.val ? "✓" : "✗",
    };
  };
</script>

<div class="flex flex-col gap-4">
  <div
    class="flex flex-col sm:flex-row w-full bg-base-100 rounded-xl px-6 text-4xl font-extrabold "
  >
    <div class="flex flex-row flex-wrap flex-grow sm:w-4/6 py-4 justify-center">
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

    <div class="divider divider-vertical sm:divider-horizontal my-0" />

    <div class="flex flex-row sm:w-2/6 py-4 justify-center">
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

  <div class="flex flex-col sm:flex-row w-full bg-base-100 rounded-xl px-6">
    <div
      class="flex flex-col flex-shrink py-2 sm:py-4 sm:w-2/6 items-center gap-2"
    >
      <div class="stat-title">DUT1</div>
      <div class="stat-value">
        <FrameValue value={frame.dut1} padWidth={1} />
      </div>
      <div class="stat-desc">Difference between UTC and UT1.</div>
    </div>

    <div class="divider divider-vertical sm:divider-horizontal my-0" />

    <div
      class="flex flex-col flex-shrink py-2 sm:py-4 sm:w-2/6 items-center gap-2"
    >
      <div class="stat-title">Summer time warning</div>
      <div class="stat-value">
        <FrameValue value={summerTimeWarning} padWidth={1} />
      </div>
      <div class="stat-desc">Summer time change in the next hour.</div>
    </div>

    <div class="divider divider-vertical sm:divider-horizontal my-0" />

    <div
      class="flex flex-col flex-shrink py-2 sm:py-4 w-full sm:w-2/6 items-center gap-2"
    >
      <div class="stat-title">Summer time</div>
      <div class="stat-value">
        <FrameValue value={summerTime} padWidth={1} />
      </div>
      <div class="stat-desc">Summer time in effect.</div>
    </div>
  </div>
</div>
