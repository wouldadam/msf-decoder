import FullDecorator from "../../../test/FullDecorator.svelte";
import ProcessorDecorator from "../../../test/ProcessorDecorator.svelte";
import Scan from "./Scan.svelte";

export default {
  title: "Displays/Scan",
  component: Scan,
  decorators: [() => FullDecorator, () => ProcessorDecorator],
};

export const Default = {
  parameters: {
    layout: "fullscreen",
  },
};
