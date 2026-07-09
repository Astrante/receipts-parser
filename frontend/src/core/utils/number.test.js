import { describe, it, expect } from 'vitest';
import { parseAmount } from './number.js';

describe('parseAmount', () => {
  it('parses dot decimals', () => {
    expect(parseAmount('1.5')).toBe(1.5);
    expect(parseAmount('0.25')).toBe(0.25);
  });

  it('parses comma decimals (iOS Serbian locale)', () => {
    expect(parseAmount('1,5')).toBe(1.5);
    expect(parseAmount('0,25')).toBe(0.25);
  });

  it('returns 0 for empty input', () => {
    expect(parseAmount('')).toBe(0);
  });

  it('returns 0 for non-numeric input', () => {
    expect(parseAmount('abc')).toBe(0);
  });

  it('strips stray characters and whitespace', () => {
    expect(parseAmount(' 2 ')).toBe(2);
    expect(parseAmount('2kg')).toBe(2);
  });

  it('parses plain integers', () => {
    expect(parseAmount('3')).toBe(3);
  });
});
