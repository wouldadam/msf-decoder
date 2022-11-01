<script lang="ts">
  import chroma from "chroma-js";
  import { onMount } from "svelte";
  import SvelteResizeObserver from "svelte-resize-observer";
  import { defaultProcessor } from "./Processor";

  export let targetFps: number = 120;
  $: frameRateMs = (1 / targetFps) * 1000;

  const style = getComputedStyle(document.querySelector(":root"));
  const bgStyle = `hsla(${style.getPropertyValue("--b2")})`;
  const axisStyle = `hsla(${style.getPropertyValue("--b1")})`;
  const scale = chroma.cubehelix().scale().domain([0, 255]).correctLightness();

  let canvasContainer: HTMLDivElement;
  let canvas: HTMLCanvasElement;

  let lastDrawTime = 0;
  let frame: number | null = null;
  let ctx: CanvasRenderingContext2D | null;

  let timeMax = 1;

  let buffer: Uint8Array | null = null;
  let freqMax = 1;

  onMount(() => {
    ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });
    ctx.imageSmoothingEnabled = false;

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
    };
  });

  function onResize() {
    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;
    canvas.style.width = `${canvasContainer.clientWidth}px`;
    canvas.style.height = `${canvasContainer.clientHeight}px`;

    // Scale the canvas based on ratio off CSS/device pixels
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    draw(lastDrawTime + frameRateMs);
  }

  /** Draw the waterfall onto the canvas. */
  function draw(time: DOMHighResTimeStamp) {
    frame = requestAnimationFrame(draw);

    // Limit how often we redraw
    if (time - lastDrawTime < frameRateMs) {
      return;
    }
    lastDrawTime = time;

    // Move the current waterfall upwards
    ctx.fillStyle = bgStyle;
    const img = ctx.getImageData(1, 0, canvas.width - 1, canvas.height - 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(img, 1, -1);

    drawAxes(ctx);
    drawLine(ctx);
  }

  /** Draw the axes on the given canvas. */
  function drawAxes(ctx: CanvasRenderingContext2D) {
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = axisStyle;

    // X
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);

    // Y
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);

    ctx.stroke();
  }

  /** Draw the next line of the waterfall. */
  function drawLine(ctx: CanvasRenderingContext2D) {
    const width = ctx.canvas.width / window.devicePixelRatio;
    const height = ctx.canvas.height / window.devicePixelRatio;

    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    ctx.imageSmoothingEnabled = false;

    if (defaultProcessor.analyser) {
      const analyser = defaultProcessor.analyser;
      const bins = analyser.frequencyBinCount;
      const sliceWidth = (width - 1) / bins;

      freqMax = analyser.context.sampleRate / 2;
      timeMax = (analyser.fftSize / analyser.context.sampleRate) * height - 1;

      if (!buffer) {
        buffer = new Uint8Array(bins);
      }
      analyser.getByteFrequencyData(buffer);

      let x = 1;
      for (let i = 0; i < bins; i++) {
        ctx.beginPath();

        ctx.strokeStyle = scale(buffer[i]).hex();
        ctx.moveTo(x, height - 1);
        ctx.lineTo(x + sliceWidth, height - 1);

        ctx.stroke();

        min = Math.min(min, buffer[i]);
        max = Math.max(max, buffer[i]);

        x += sliceWidth;
      }
    }
  }
</script>

<!--
  @component
  Renders a waterfall visualisation using data from an AnalyserNode.

  Allows the fps to be specified.
-->
<div class="card card-compact w-full h-full bg-base-200 shadow-xl">
  <div class="card-body flex">
    <div class="flex w-full h-full flex-col">
      <div class="flex flex-row grow items-center">
        <div class="flex h-full w-10 flex-col justify-center items-center">
          <span class="text-xs h-min whitespace-nowrap -rotate-90 ">Time</span>
        </div>

        <div class="w-full h-full" bind:this={canvasContainer}>
          <SvelteResizeObserver on:resize={onResize} />
          <canvas
            width="0"
            height="0"
            class="fixed"
            data-testid="waterfall-canvas"
            bind:this={canvas}
          />
        </div>
      </div>

      <div class="flex flex-row justify-between">
        <span class="text-xs pl-8">0</span>
        <span class="text-xs">Frequency (Hz)</span>
        <span class="text-xs">{freqMax}</span>
      </div>
    </div>
  </div>
</div>
