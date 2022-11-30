<script lang="ts">
  import { ValueState, type FrameValue } from "../processing/msf";

  export let value: FrameValue<any>;
  export let padChar: string = "0";
  export let padWidth: number = 2;
  export let fallbackChar: string = "-";

  const pad = (value: FrameValue<any>, char: string, width: number) => {
    if (value.state !== ValueState.Unset) {
      return value.val.toString().padStart(width, char);
    }

    return "".padStart(width, fallbackChar);
  };

  $: content = pad(value, padChar, padWidth);
</script>

<!--
  @component
  Displays a value that can be in one of several states.

  If the value is undefined then the fallback char is used.

  padChar and padWidth can be used to prefix a defined value.
-->
<span
  class="contents"
  class:text-warning={value.state === ValueState.Incomplete}
  class:text-info={value.state === ValueState.Complete}
  class:text-error={value.state === ValueState.Invalid}
  class:text-success={value.state === ValueState.Valid}
>
  {content}
</span>
