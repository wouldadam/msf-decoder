import { test } from "vitest";
import { RMSNode } from "./RMSNode";
import { RMSProcessor } from "./RMSProcessor";

const frameSize = 128;

test("alpha of zero means output is zeros", () => {
  const processor = new RMSProcessor({
    processorOptions: {
      alpha: 0,
    },
  });

  const inputs = [[new Float32Array(frameSize).fill(10)]];
  const outputs = [[new Float32Array(frameSize).fill(-1)]];

  processor.process(inputs, outputs, {});

  expect(outputs[0][0]).toContain(new Float32Array(frameSize).fill(0));
});

test("alpha of one means input is output", () => {
  const processor = new RMSProcessor({
    processorOptions: {
      alpha: 1,
    },
  });

  const inputs = [[new Float32Array(frameSize)]];
  for (let idx = 0; idx < frameSize; ++idx) {
    inputs[0][0][idx] = idx;
  }

  const outputs = [[new Float32Array(frameSize).fill(-1)]];

  processor.process(inputs, outputs, {});

  expect(outputs[0][0]).toContain(inputs[0][0]);
});

test("can create node", () => {
  const node = new RMSNode(jest.fn() as any, { alpha: 0 });
  expect(node).not.toBeNull();
});
