<script lang="ts">
  import Chart from "./Chart.svelte";
  import { defaultProcessor } from "./Processor";

  const style = getComputedStyle(document.querySelector(":root"));
  const lineStyle = `hsla(${style.getPropertyValue("--p")})`;

  const sampleMin = 0;
  const sampleMax = 255;

  let buffer: Uint8Array | null = null;
  let freqMax = 1;
  let dBMin = -100;
  let dBMax = -30;

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

    if (defaultProcessor.analyser) {
      const analyser = defaultProcessor.analyser;
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
  }
</script>

<!--
  @component
  Renders a scan visualisation using data from an AnalyserNode.

  Allows the fps to be specified.
-->
<div class="card card-compact w-full h-56 bg-base-200 shadow-xl">
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
    />
  </div>
</div>
