import { CreateFrameValue, type FrameValue } from "./FrameValue";

/// Values for days of the week in a frame
export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

/// Allowed DUT1 values
export type DUT1 =
  | -0.8
  | -0.7
  | -0.6
  | -0.5
  | -0.4
  | -0.3
  | -0.2
  | -0.1
  | 0
  | 0.1
  | 0.2
  | 0.3
  | 0.4
  | 0.5
  | 0.6
  | 0.7
  | 0.8;

/// Frame of MSF information
export interface TimeFrame {
  /// -0.8 to +0.8 in 0.1 increments
  dut1: FrameValue<DUT1>;

  /// 00 to 99
  year: FrameValue<number>;

  // 01 to 12
  month: FrameValue<number>;

  /// 01 to 31
  dayOfMonth: FrameValue<number>;

  // Day of the week
  dayOfWeek: FrameValue<DayOfWeek>;

  /// 00 to 23
  hour: FrameValue<number>;

  /// 00 to 59
  minute: FrameValue<number>;

  /// Indicates that the summer time flag is about to change
  summerTimeWarning: FrameValue<boolean>;

  /// Indicates that the broadcast is in summer time (UTC+1)
  summerTime: FrameValue<boolean>;
}

/// Create a default initialized TimeFrame
export function CreateTimeFrame(): TimeFrame {
  return {
    dut1: CreateFrameValue(0),
    year: CreateFrameValue(0),
    month: CreateFrameValue(0),
    dayOfMonth: CreateFrameValue(0),
    dayOfWeek: CreateFrameValue(DayOfWeek.Sunday),
    hour: CreateFrameValue(0),
    minute: CreateFrameValue(0),
    summerTimeWarning: CreateFrameValue(false),
    summerTime: CreateFrameValue(false),
  };
}
