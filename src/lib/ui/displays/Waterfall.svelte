<script lang="ts">
  import chroma from "chroma-js";
  import { getContext, onMount } from "svelte";
  import SvelteResizeObserver from "svelte-resize-observer";
  import { carrierFrequencyHz, displayMode } from "../../config";
  import { defaultProcessorKey, Processor } from "../../processing/Processor";

  export let targetFps: number = 120;
  $: frameRateMs = (1 / targetFps) * 1000;

  const style = getComputedStyle(document.querySelector(":root"));
  const scale = chroma.cubehelix().scale().domain([0, 255]).correctLightness();

  let canvasContainer: HTMLDivElement;
  let waterfallCanvas: HTMLCanvasElement;
  let carrierCanvas: HTMLCanvasElement;

  let waterfallCtx: CanvasRenderingContext2D | null;
  let carrierCtx: CanvasRenderingContext2D | null;

  let lastDrawTime = 0;
  let frame: number | null = null;

  let buffer: Uint8Array | null = null;
  let freqMax = $carrierFrequencyHz * 2;

  const processor = getContext<Processor>(defaultProcessorKey);

  onMount(() => {
    waterfallCtx = waterfallCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    waterfallCtx.imageSmoothingEnabled = false;

    carrierCtx = carrierCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
    };
  });

  function onResize() {
    waterfallCanvas.width = canvasContainer.clientWidth;
    waterfallCanvas.height = canvasContainer.clientHeight;
    waterfallCanvas.style.width = `${canvasContainer.clientWidth}px`;
    waterfallCanvas.style.height = `${canvasContainer.clientHeight}px`;

    carrierCanvas.width = canvasContainer.clientWidth;
    carrierCanvas.height = canvasContainer.clientHeight;
    carrierCanvas.style.width = `${canvasContainer.clientWidth}px`;
    carrierCanvas.style.height = `${canvasContainer.clientHeight}px`;

    // Scale the canvas based on ratio off CSS/device pixels
    waterfallCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    carrierCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

    draw(lastDrawTime, true);
  }

  /** Draw the waterfall onto the canvas. */
  function draw(time: DOMHighResTimeStamp, forceDraw: boolean = false) {
    frame = requestAnimationFrame(draw);

    // Limit how often we redraw
    if (!forceDraw && time - lastDrawTime < frameRateMs) {
      return;
    }
    lastDrawTime = time;

    const bgStyle = `hsla(${style.getPropertyValue("--b2")})`;

    // Move the current waterfall upwards
    if (processor?.context?.state === "running") {
      try {
        waterfallCtx.fillStyle = bgStyle;
        const img = waterfallCtx.getImageData(
          1,
          0,
          waterfallCanvas.width - 1,
          waterfallCanvas.height - 1
        );
        waterfallCtx.clearRect(
          0,
          0,
          waterfallCanvas.width,
          waterfallCanvas.height
        );
        waterfallCtx.putImageData(img, 1, -1);
      } catch (e) {}
    }

    drawAxes(waterfallCtx);
    drawLine(waterfallCtx);

    drawCarrier(carrierCtx);
  }

  /** Draw the axes on the given canvas. */
  function drawAxes(ctx: CanvasRenderingContext2D) {
    const width = ctx.canvas.width / window.devicePixelRatio;
    const height = ctx.canvas.height / window.devicePixelRatio;
    const axisStyle = `hsla(${style.getPropertyValue("--bc")})`;

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

    ctx.imageSmoothingEnabled = false;

    const analyser = processor?.analyser;
    if (analyser) {
      const bins = analyser.frequencyBinCount;
      const sliceWidth = (width - 1) / bins;

      freqMax = analyser.context.sampleRate / 2;

      if (!buffer || buffer.length != bins) {
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

        x += sliceWidth;
      }
    }
  }

  function drawCarrier(ctx: CanvasRenderingContext2D) {
    const width = ctx.canvas.width / window.devicePixelRatio;
    const height = ctx.canvas.height / window.devicePixelRatio;
    const carrierStyle = `hsla(${style.getPropertyValue("--a")})`;

    const freqPerPx = freqMax / width;
    const x = $carrierFrequencyHz / freqPerPx;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if ($displayMode === "raw" || $displayMode === "filter") {
      ctx.strokeStyle = carrierStyle;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 1);
      ctx.stroke();
    }
  }

  function onClick(e: MouseEvent) {
    if ($displayMode === "raw" || $displayMode === "filter") {
      const freqPerPx = freqMax / carrierCtx.canvas.width;
      $carrierFrequencyHz = Math.round(freqPerPx * e.offsetX);
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
            class="absolute"
            data-testid="waterfall-canvas"
            bind:this={waterfallCanvas}
          />

          <canvas
            width="0"
            height="0"
            class="absolute"
            data-testid="carrier-canvas"
            bind:this={carrierCanvas}
            on:click={onClick}
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
