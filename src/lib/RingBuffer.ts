/// A fixed capacity circular buffer
export class RingBuffer {
  private buffer: Float32Array;
  private writeIdx: number;
  private readIdx: number;
  private currentLength: number;

  constructor(capacity: number) {
    this.buffer = new Float32Array(capacity);
    this.writeIdx = 0;
    this.readIdx = 0;
    this.currentLength = 0;
  }

  /// Adds data to the buffer, overwrites oldest data if full
  public push(sequence: ArrayLike<number>) {
    for (let idx = 0; idx < sequence.length; ++idx) {
      this.buffer[this.writeIdx] = sequence[idx];
      this.writeIdx = (this.writeIdx + 1) % this.buffer.length;
    }

    this.currentLength = Math.min(
      this.capacity,
      this.currentLength + sequence.length
    );
  }

  /// Extracts data from buffer the size of the input array, errors if not enough data is available
  public pull(sequence: Float32Array) {
    if (sequence.length > this.length) {
      throw RangeError(
        `Requested ${sequence.length} elements but only have ${this.length}.`
      );
    }

    for (let idx = 0; idx < sequence.length; ++idx) {
      sequence[idx] = this.buffer[this.readIdx];
      this.readIdx = (this.readIdx + 1) % this.buffer.length;
    }

    this.currentLength = Math.max(0, this.currentLength - sequence.length);
  }

  /// Clears all data from the buffer
  public reset() {
    this.writeIdx = 0;
    this.readIdx = 0;
  }

  /// The amount of data in the buffer
  public get length(): number {
    return this.currentLength;
  }

  /// How much data can be stored in the buffer
  public get capacity(): number {
    return this.buffer.length;
  }

  /// Peeks at data in the buffer
  public at(idx: number) {
    if (idx >= this.currentLength) {
      throw RangeError(`Index ${idx} out of range: ${this.currentLength}`);
    }

    return this.buffer[this.readIdx + idx];
  }

  /// Clears length data from the buffer, oldest first
  public skip(length: number) {
    if (length > this.currentLength) {
      throw RangeError(
        `Skip length ${length} out of range: ${this.currentLength}`
      );
    }

    this.readIdx = (this.readIdx + length) % this.buffer.length;
    this.currentLength = Math.max(0, this.currentLength - length);
  }
}
