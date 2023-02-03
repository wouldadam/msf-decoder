/// The symbols for a minute segment
export const minuteSegment = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0] as const;

/// The symbols for a second segment, -1 indicates variable symbols
export const secondSegment = [1, -1, -1, 0, 0, 0, 0, 0, 0, 0] as const;

// Offset into a segment for the a bit
export const aBitOffset = 1;

// Offset into a segment for the b bit
export const bBitOffset = 2;

/// Bit values for BCD encoded numbers, RtL
export const bcdBits = [1, 2, 4, 8, 10, 20, 40, 80] as const;

// Start and end second offsets for each data element in a frame (inclusive)
export const secondOffsets = {
  dut1Pos: [1, 8] as const,
  dut1Neg: [9, 16] as const,
  year: [17, 24] as const,
  month: [25, 29] as const,
  dayOfMonth: [30, 35] as const,
  dayOfWeek: [36, 38] as const,
  hour: [39, 44] as const,
  minute: [45, 51] as const,
  summerTimeWarning: [53] as const,
  yearParity: [54] as const,
  dayParity: [55] as const,
  dayOfWeekParity: [56] as const,
  timeParity: [57] as const,
  summerTime: [58, 58] as const,
};
