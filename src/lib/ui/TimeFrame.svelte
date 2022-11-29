<script lang="ts">
  import { DayOfWeek, type TimeFrame } from "../processing/msf";
  import FrameValue from "./FrameValue.svelte";

  export let frame: TimeFrame;
  export let second: number | null = null;

  $: dayOfWeek =
    frame.dayOfWeek !== undefined
      ? Object.values(DayOfWeek)[frame.dayOfWeek]
      : undefined;

  $: summerTimeWarning = boolToChar(frame.summerTimeWarning);
  $: summerTime = boolToChar(frame.summerTime);

  const boolToChar = (value: boolean | undefined) => {
    if (value === undefined) {
      return undefined;
    }

    return value ? "✓" : "✗";
  };
</script>

<div class="flex flex-col gap-4">
  <div
    class="flex flex-col sm:flex-row w-full bg-base-100 rounded-xl px-6 text-4xl font-extrabold "
  >
    <div class="flex flex-row flex-wrap flex-grow sm:w-4/6 py-4 justify-center">
      <div>
        <FrameValue
          value={frame.year}
          isComplete={frame.yearComplete}
          isValid={frame.yearParityValid}
        />
      </div>

      <div>/</div>

      <div>
        <FrameValue
          value={frame.month}
          isComplete={frame.monthComplete}
          isValid={frame.dayParityValid}
        />
      </div>

      <div>/</div>

      <div>
        <FrameValue
          value={frame.dayOfMonth}
          isComplete={frame.dayOfMonthComplete}
          isValid={frame.dayParityValid}
        />
      </div>

      <div>&nbsp;</div>

      <div>
        <FrameValue
          value={dayOfWeek}
          isComplete={frame.dayOfWeekComplete}
          isValid={frame.dayOfWeekParityValid}
          padWidth={1}
        />
      </div>
    </div>

    <div class="divider divider-vertical sm:divider-horizontal my-0" />

    <div class="flex flex-row sm:w-2/6 py-4 justify-center">
      <FrameValue
        value={frame.hour}
        isComplete={frame.hourComplete}
        isValid={frame.timeParityValid}
      />
      <span>:</span>
      <FrameValue
        value={frame.minute}
        isComplete={frame.minuteComplete}
        isValid={frame.timeParityValid}
      />
      {#if second !== null}
        <span>:</span>
        <FrameValue
          value={second}
          isComplete={true !== null}
          isValid={true !== null}
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
        <FrameValue
          value={frame.dut1}
          isComplete={frame.dut1 !== undefined}
          isValid={frame.dut1 !== undefined}
          padWidth={1}
        />
      </div>
      <div class="stat-desc">Difference between UTC and UT1.</div>
    </div>

    <div class="divider divider-vertical sm:divider-horizontal my-0" />

    <div
      class="flex flex-col flex-shrink py-2 sm:py-4 sm:w-2/6 items-center gap-2"
    >
      <div class="stat-title">Summer time warning</div>
      <div class="stat-value">
        <FrameValue
          value={summerTimeWarning}
          isComplete={summerTimeWarning !== undefined}
          isValid={summerTimeWarning !== undefined}
          padWidth={1}
        />
      </div>
      <div class="stat-desc">Summer time change in the next hour.</div>
    </div>

    <div class="divider divider-vertical sm:divider-horizontal my-0" />

    <div
      class="flex flex-col flex-shrink py-2 sm:py-4 w-full sm:w-2/6 items-center gap-2"
    >
      <div class="stat-title">Summer time</div>
      <div class="stat-value">
        <FrameValue
          value={summerTime}
          isComplete={summerTime !== undefined}
          isValid={summerTime !== undefined}
          padWidth={1}
        />
      </div>
      <div class="stat-desc">Summer time in effect.</div>
    </div>
  </div>
</div>
