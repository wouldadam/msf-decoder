<script lang="ts">
  import { getContext } from "svelte";
  import { carrierFrequencyHz, displayMode } from "../config";
  import { defaultProcessorKey, Processor } from "../processing/Processor";
  import Chart from "./Chart.svelte";

  const style = getComputedStyle(document.querySelector(":root"));

  const sampleMin = 0;
  const sampleMax = 255;

  let buffer: Uint8Array | null = null;
  let freqMax = $carrierFrequencyHz * 2;
  let dBMin = -100;
  let dBMax = -30;

  const processor = getContext<Processor>(defaultProcessorKey);

  /** Draw the plot line on the given canvas. */
  function drawLine(ctx: CanvasRenderingContext2D) {
    const width = ctx.canvas.width / window.devicePixelRatio;
    const height = ctx.canvas.height / window.devicePixelRatio;
    const lineStyle = `hsla(${style.getPropertyValue("--p")})`;

    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    const step = height / (sampleMax - sampleMin);

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = lineStyle;

    const analyser = processor?.analyser;
    if (analyser) {
      const bins = analyser.frequencyBinCount;
      const sliceWidth = width / bins;

      freqMax = analyser.context.sampleRate / 2;
      dBMin = analyser.minDecibels;
      dBMax = analyser.maxDecibels;

      if (!buffer) {
        buffer = new Uint8Array(bins);
      }
      analyser.getByteFrequencyData(buffer);

      let x = 0;
      for (let i = 0; i < bins; i++) {
        const y = height - (buffer[i] - sampleMin) * step;

        min = Math.min(min, buffer[i]);
        max = Math.max(max, buffer[i]);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }
    } else {
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
    }

    ctx.stroke();

    if ($displayMode === "raw" || $displayMode === "filter") {
      drawCarrier(ctx);
    }
  }

  function drawCarrier(ctx: CanvasRenderingContext2D) {
    const width = ctx.canvas.width / window.devicePixelRatio;
    const height = ctx.canvas.height / window.devicePixelRatio;
    const carrierStyle = `hsla(${style.getPropertyValue("--a")})`;

    const freqPerPx = freqMax / width;
    const x = $carrierFrequencyHz / freqPerPx;

    ctx.strokeStyle = carrierStyle;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height - 1);
    ctx.stroke();
  }

  function onClick(e: MouseEvent) {
    if (e.target instanceof HTMLCanvasElement) {
      if ($displayMode === "raw" || $displayMode === "filter") {
        const width = e.target.width;
        const freqPerPx = freqMax / width;
        $carrierFrequencyHz = Math.round(freqPerPx * e.offsetX);
      }
    }
  }
</script>

<!--
  @component
  Renders a scan visualisation using data from an AnalyserNode.

  Allows the fps to be specified.
-->
<div class="card card-compact w-full h-full bg-base-200 shadow-xl">
  <div class="card-body flex">
    <Chart
      {drawLine}
      xAxis={{
        label: "Frequency (Hz)",
        minLabel: "0",
        maxLabel: freqMax.toFixed(0),
      }}
      yAxis={{
        label: "Power (dB)",
        minLabel: dBMin.toFixed(0),
        maxLabel: dBMax.toFixed(0),
      }}
      on:click={onClick}
    />
  </div>
</div>
