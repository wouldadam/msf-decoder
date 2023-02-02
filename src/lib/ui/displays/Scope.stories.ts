import FullDecorator from "../../../test/FullDecorator.svelte";
import ProcessorDecorator from "../../../test/ProcessorDecorator.svelte";
import Scope from "./Scope.svelte";

export default {
  title: "Displays/Scope",
  component: Scope,
  decorators: [() => FullDecorator, () => ProcessorDecorator],
};

export const Default = {
  parameters: {
    layout: "fullscreen",
  },
};
