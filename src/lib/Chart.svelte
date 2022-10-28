<script lang="ts">
  import { onMount } from "svelte";
  import SvelteResizeObserver from "svelte-resize-observer";

  interface Axis {
    label: string;
    minLabel?: string;
    maxLabel?: string;
    position?: "center" | "side";
  }

  export let targetFps: number = 20;
  export let xAxis: Axis = { label: "X" };
  export let yAxis: Axis = { label: "Y" };
  export let drawLine: (ctx: CanvasRenderingContext2D) => void = () => {};

  $: frameRateMs = (1 / targetFps) * 1000;

  const style = getComputedStyle(document.querySelector(":root"));
  const bgStyle = `hsla(${style.getPropertyValue("--b2")})`;
  const axisStyle = `hsla(${style.getPropertyValue("--b1")})`;

  let canvasContainer: HTMLDivElement;
  let canvas: HTMLCanvasElement;

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

  /** Draw the chart onto the canvas. */
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

    // X
    if (!xAxis.position || xAxis.position === "side") {
      ctx.moveTo(0, height);
      ctx.lineTo(width, height);
    } else {
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
    }

    // Y
    if (!yAxis.position || yAxis.position === "side") {
      ctx.moveTo(0, 0);
      ctx.lineTo(0, height);
    } else {
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
    }

    ctx.stroke();
  }
</script>

<!--
  @component
  Renders a chart with axes.

  Allows the fps to be specified.
  Drawing of the line play is oursourced to the parent.
-->
<div class="flex w-full h-full flex-col">
  <div class="flex flex-row grow items-center">
    <div class="flex h-full w-10 flex-col justify-between items-center">
      <span class="text-xs">{yAxis.maxLabel || ""}</span>
      <span class="text-xs h-min whitespace-nowrap -rotate-90 "
        >{yAxis.label}</span
      >
      <span class="text-xs">{yAxis.minLabel || ""}</span>
    </div>

    <div class="w-full h-full" bind:this={canvasContainer}>
      <SvelteResizeObserver on:resize={onResize} />
      <canvas
        width="0"
        height="0"
        class="w-full h-full"
        data-testid="chart-canvas"
        bind:this={canvas}
      />
    </div>
  </div>

  <div class="flex flex-row justify-between">
    <span class="text-xs pl-8">{xAxis.minLabel || ""}</span>
    <span class="text-xs">{xAxis.label}</span>
    <span class="text-xs">{xAxis.maxLabel || ""}</span>
  </div>
</div>
