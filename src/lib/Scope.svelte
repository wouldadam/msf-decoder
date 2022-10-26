<script lang="ts">
  import { onMount } from "svelte";
  import { defaultProcessor } from "./Processor";

  export let targetFps: number = 20;
  $: frameRateMs = (1 / targetFps) * 1000;

  const style = getComputedStyle(document.querySelector(":root"));
  const bgStyle = `hsla(${style.getPropertyValue("--b2")})`;
  const axisStyle = `hsla(${style.getPropertyValue("--b1")})`;
  const lineStyle = `hsla(${style.getPropertyValue("--p")})`;

  let canvas: HTMLCanvasElement;
  let buffer: Uint8Array | null = null;

  let sampleMin = 0;
  let sampleMax = 255;
  let lastDrawTime = 0;
  let frame: number | null = null;
  let ctx: CanvasRenderingContext2D | null;

  onMount(() => {
    ctx = canvas.getContext("2d");
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
    };
  });

  /** Draw the scope onto the canvas. */
  function draw(time: DOMHighResTimeStamp) {
    frame = requestAnimationFrame(draw);

    // Limit how often we redraw
    if (time - lastDrawTime < frameRateMs) {
      return;
    }
    lastDrawTime = time;

    ctx.fillStyle = bgStyle;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawAxes(ctx);
    drawLine(ctx);
  }

  /** Draw the axes on the given canvas. */
  function drawAxes(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = axisStyle;

    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);

    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();
  }

  /** Draw the plot line on the given canvas. */
  function drawLine(ctx: CanvasRenderingContext2D) {
    const width = canvas.width;
    const height = canvas.height;

    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    const step = canvas.height / (sampleMax - sampleMin);

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = lineStyle;

    if (defaultProcessor.analyser) {
      const analyser = defaultProcessor.analyser;
      const sliceWidth = (canvas.width * 1.0) / analyser.frequencyBinCount;

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
    <div class="flex grow items-center">
      <span class="text-xs h-min -rotate-90">Amp</span>
      <canvas
        class="w-full h-28"
        data-testid="scope-canvas"
        bind:this={canvas}
      />
    </div>

    <div class="flex flex-row justify-center">
      <span class="text-xs">Time</span>
    </div>
  </div>
</div>
