<script lang="ts">
  import ResizeObserver from "svelte-resize-observer";
  import { onMount } from "svelte";
  import { defaultProcessor } from "./Processor";

  export let targetFps: number = 20;
  $: frameRateMs = (1 / targetFps) * 1000;

  const style = getComputedStyle(document.querySelector(":root"));
  const bgStyle = `hsla(${style.getPropertyValue("--b2")})`;
  const axisStyle = `hsla(${style.getPropertyValue("--b1")})`;
  const lineStyle = `hsla(${style.getPropertyValue("--p")})`;

  let canvasContainer: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let buffer: Uint8Array | null = null;

  let timeMaxMs = 1;
  let sampleMin = 0;
  let sampleMax = 255;
  let lastDrawTime = 0;
  let frame: number | null = null;
  let ctx: CanvasRenderingContext2D | null;

  onMount(() => {
    ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
    };
  });

  function onResize() {
    // Take a copy of the current canvas as resizing it will clear it
    // and cause flickering
    let img;
    try {
      img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {}

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Scale the canvas based on ratio off CSS/device pixels
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Restore the canvas pixel data
    if (img) {
      ctx.putImageData(img, 0, 0);
    }
  }

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
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = axisStyle;

    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);

    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
  }

  /** Draw the plot line on the given canvas. */
  function drawLine(ctx: CanvasRenderingContext2D) {
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    const step = height / (sampleMax - sampleMin);

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = lineStyle;

    if (defaultProcessor.analyser) {
      const analyser = defaultProcessor.analyser;
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
      timeMaxMs = (analyser.fftSize / analyser.context.sampleRate) * 1000;
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

      <div class="w-full h-full" bind:this={canvasContainer}>
        <ResizeObserver on:resize={onResize} />
        <canvas
          width="0"
          height="0"
          class="w-full h-full"
          data-testid="scope-canvas"
          bind:this={canvas}
        />
      </div>
    </div>

    <div class="flex flex-row justify-between">
      <span class="text-xs pl-6">0</span>
      <span class="text-xs">Time (s)</span>
      <span class="text-xs">{timeMaxMs.toFixed(2)}</span>
    </div>
  </div>
</div>
