<script lang="ts">
  export let value: any;
  export let isComplete: boolean;
  export let isValid: boolean;
  export let padChar: string = "0";
  export let padWidth: number = 2;
  export let fallbackChar: string = "-";

  const pad = (value: number | undefined, char: string, width: number) => {
    if (value !== undefined) {
      return value.toString().padStart(width, char);
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
  class:text-warning={value !== undefined && !isComplete}
  class:text-info={isComplete === true && isValid === undefined}
  class:text-error={isComplete === true && isValid === false}
  class:text-success={isComplete === true && isValid === true}
>
  {content}
</span>
