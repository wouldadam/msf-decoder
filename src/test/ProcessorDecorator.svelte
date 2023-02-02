<script lang="ts">
  import { setContext } from "svelte";
  import { defaultProcessorKey } from "..//lib/processing/Processor";

  const processor = {
    analyser: {
      fftSize: 1024,
      frequencyBinCount: 512,
      minDecibels: 0,
      maxDecibels: 10,
      smoothingTimeConstant: 0,
      channelCount: 1,
      channelCountMode: "explicit",
      channelInterpretation: "discrete",
      numberOfInputs: 1,
      numberOfOutputs: 1,
      context: {
        sampleRate: 48000,
      },
      connect: () => {},
      disconnect: () => {},
      dispatchEvent: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      getFloatFrequencyData: () => {},
      getFloatTimeDomainData: () => {},

      getByteFrequencyData: (buffer: Uint8Array) => {
        for (let idx = 0; idx < buffer.length; ++idx) {
          buffer[idx] = Math.random() * 250;
        }
      },

      getByteTimeDomainData: (buffer: Uint8Array) => {
        for (let idx = 0; idx < buffer.length; ++idx) {
          buffer[idx] = Math.random() * 250;
        }
      },
    },
    context: {
      state: "running",
    },
  };

  setContext(defaultProcessorKey, processor);
</script>

<!--
  @component
  Inserts a mock processor into the context for testing.
-->
<div>
  <slot />
</div>
