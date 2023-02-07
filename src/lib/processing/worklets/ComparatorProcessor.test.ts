import { test } from "vitest";
import { ComparatorNode } from "./ComparatorNode";
import {
  ComparatorProcessor,
  negativePolarityFlag,
  positivePolarityFlag,
} from "./ComparatorProcessor";

const frameSize = 128;

test.each([["positive"], ["negative"]])(
  "basic comparison with %s polarity",
  (polarity: "positive" | "negative") => {
    const framesPerSecond = global.sampleRate / frameSize;
    const thresholdWindowSec = 2;

    const on = polarity == "positive" ? 1 : 0;
    const off = polarity == "positive" ? 0 : 1;

    const processor = new ComparatorProcessor();

    const posInputs = [[new Float32Array(frameSize).fill(50)]];
    const negInputs = [[new Float32Array(frameSize).fill(-50)]];
    const outputs = [[new Float32Array(frameSize)]];
    const params = {
      threshold: new Float32Array([0]),
      polarity: new Float32Array([
        polarity === "positive" ? positivePolarityFlag : negativePolarityFlag,
      ]),
    };

    for (let rep = 0; rep < framesPerSecond * thresholdWindowSec; ++rep) {
      processor.process(posInputs, outputs, params);
      processor.process(negInputs, outputs, params);
    }

    global.currentTime = thresholdWindowSec;

    for (let rep = 0; rep < framesPerSecond * thresholdWindowSec; ++rep) {
      processor.process(posInputs, outputs, params);
      expect(outputs[0][0]).toContain(new Float32Array(frameSize).fill(on));

      processor.process(negInputs, outputs, params);
      expect(outputs[0][0]).toContain(new Float32Array(frameSize).fill(off));
    }
  }
);

test("can create node", () => {
  const node = new ComparatorNode(jest.fn() as any);
  expect(node).not.toBeNull();
});
