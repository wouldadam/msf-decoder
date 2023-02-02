import FullDecorator from "../../../test/FullDecorator.svelte";
import ProcessorDecorator from "../../../test/ProcessorDecorator.svelte";
import Waterfall from "./Waterfall.svelte";

export default {
  title: "Displays/Waterfall",
  component: Waterfall,
  decorators: [() => FullDecorator, () => ProcessorDecorator],
};

export const Default = {
  parameters: {
    layout: "fullscreen",
  },
};
