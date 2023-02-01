import { CreateTimeFrame } from "../../processing/msf";
import Frames from "./Frames.svelte";

export default {
  title: "Time/Frames",
  component: Frames,
};

export const Default = {
  args: { frame: CreateTimeFrame() },
};
