import { describe, expect, it } from 'vitest';
import { bucket } from './primitives';

describe('bucket', () => {
  it('maps zero and empty ranges to 0', () => {
    expect(bucket(0, 10)).toBe(0);
    expect(bucket(5, 0)).toBe(0);
  });
  it('scales into 1..4 with the max in the top bucket', () => {
    expect(bucket(1, 100)).toBe(1);
    expect(bucket(50, 100)).toBe(2);
    expect(bucket(51, 100)).toBe(3);
    expect(bucket(100, 100)).toBe(4);
  });
});
