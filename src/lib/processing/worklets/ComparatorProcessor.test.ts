import { test } from "vitest";
import { ComparatorProcessor } from "./ComparatorProcessor";

const frameSize = 128;

test.each([["positive"], ["negative"]])(
  "basic comparison with %s polarity",
  (polarity: "positive" | "negative") => {
    const framesPerSecond = global.sampleRate / frameSize;
    const thresholdWindowSec = 2;

    const on = polarity == "positive" ? 1 : 0;
    const off = polarity == "positive" ? 0 : 1;

    const processor = new ComparatorProcessor({
      processorOptions: {
        polarity,
        threshold: 0,
      },
    });

    const posInputs = [[new Float32Array(frameSize).fill(50)]];
    const negInputs = [[new Float32Array(frameSize).fill(-50)]];
    const outputs = [[new Float32Array(frameSize)]];

    for (let rep = 0; rep < framesPerSecond * thresholdWindowSec; ++rep) {
      processor.process(posInputs, outputs, {});
      processor.process(negInputs, outputs, {});
    }

    global.currentTime = thresholdWindowSec;

    for (let rep = 0; rep < framesPerSecond * thresholdWindowSec; ++rep) {
      processor.process(posInputs, outputs, {});
      expect(outputs[0][0]).toContain(new Float32Array(frameSize).fill(on));

      processor.process(negInputs, outputs, {});
      expect(outputs[0][0]).toContain(new Float32Array(frameSize).fill(off));
    }
  }
);
