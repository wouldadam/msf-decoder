<script lang="ts">
  import { getContext } from "svelte";
  import { defaultProcessorKey, Processor } from "../processing/Processor";
  import Chart from "./Chart.svelte";

  const style = getComputedStyle(document.querySelector(":root"));
  const lineStyle = `hsla(${style.getPropertyValue("--p")})`;

  let buffer: Uint8Array | null = null;

  let timeMaxMs = 1;
  let sampleMin = 0;
  let sampleMax = 255;

  let xAxis = {
    position: "center" as const,
    label: "Time (ms)",
    minLabel: "0",
    maxLabel: timeMaxMs.toFixed(2),
  };

  const processor = getContext<Processor>(defaultProcessorKey);

  /** Draw the plot line on the given canvas. */
  function drawLine(ctx: CanvasRenderingContext2D) {
    const width = ctx.canvas.width / window.devicePixelRatio;
    const height = ctx.canvas.height / window.devicePixelRatio;

    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    const step = height / (sampleMax - sampleMin);

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = lineStyle;

    const analyser = processor?.analyser;
    if (analyser) {
      const sliceWidth = width / analyser.frequencyBinCount;

      if (!buffer) {
        buffer = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteTimeDomainData(buffer);

      let x = 0;
      for (let i = 0; i < analyser.frequencyBinCount; i++) {
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

      // Decide the next min an max y axis based on the current values
      const axisRange = Math.min(min, 255 - max);
      sampleMin = Math.max(axisRange - 25, 0);
      sampleMax = Math.min(255 - axisRange + 25, 255);

      // Make sure the variable axis vaues are up to date
      xAxis = {
        ...xAxis,
        maxLabel: (
          (analyser.fftSize / analyser.context.sampleRate) *
          1000
        ).toFixed(2),
      };
    } else {
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
    }

    ctx.stroke();
  }
</script>

<!--
  @component
  Renders a scope visualisation using data from an AnalyserNode.

  Allows the fps to be specified.

  Axes change dynamically based on the previous buffer.
-->
<div class="card card-compact w-full h-40 bg-base-200 shadow-xl">
  <div class="card-body flex">
    <Chart {xAxis} yAxis={{ label: "Amp" }} {drawLine} />
  </div>
</div>
