import FullDecorator from "../../../test/FullDecorator.svelte";
import Chart from "./Chart.svelte";

export default {
  title: "Displays/Chart",
  component: Chart,
  decorators: [() => FullDecorator],
};

function drawLine(ctx: CanvasRenderingContext2D) {
  const width = ctx.canvas.width / window.devicePixelRatio;
  const height = ctx.canvas.height / window.devicePixelRatio;

  ctx.beginPath();
  ctx.moveTo(0, 0);

  for (let x = 0; x < width; x += 10) {
    ctx.lineTo(x, Math.random() * height);
  }

  ctx.lineTo(width, 0);
  ctx.stroke();
}

export const Default = {
  args: {
    drawLine,
    targetFps: 10,
  },
  parameters: {
    layout: "fullscreen",
  },
};

export const Axes = {
  args: {
    drawLine,
    targetFps: 10,
    xAxis: {
      label: "X axis label",
      minLabel: "MINX",
      maxLabel: "MAXX",
      position: "side",
    },
    yAxis: {
      label: "Y axis label",
      minLabel: "MINY",
      maxLabel: "MAXY",
      position: "side",
    },
  },
};
