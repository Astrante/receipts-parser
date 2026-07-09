import { describe, it, expect } from 'vitest';
import { reconcileDistribution, getUnitPrice } from './Product.js';
import { calculateBuyerShare } from './Buyer.js';
import { calculateReceiptTotal } from './Receipt.js';

const buyers = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' },
];

describe('reconcileDistribution', () => {
  it('keeps the sum equal to quantity, first buyer absorbs the residual', () => {
    const dist = reconcileDistribution({ a: 0.3, b: 0.2, c: 0.3 }, buyers, 1);
    expect(dist.b).toBe(0.2);
    expect(dist.c).toBe(0.3);
    expect(dist.a).toBeCloseTo(0.5); // 1 - 0.2 - 0.3
    const sum = dist.a + dist.b + dist.c;
    expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
  });

  it('treats a missing buyer share as 0', () => {
    const dist = reconcileDistribution({ a: 0.1, b: 0.1 }, buyers, 0.5);
    expect(dist.b).toBe(0.1);
    expect(dist.c).toBe(0);
    expect(dist.a).toBeCloseTo(0.4); // 0.5 - 0.1 - 0
  });

  it('returns a copy of the input when there are no buyers', () => {
    const dist = reconcileDistribution({ a: 1 }, [], 1);
    expect(dist).toEqual({ a: 1 });
  });
});

describe('getUnitPrice', () => {
  it('computes total / quantity', () => {
    expect(getUnitPrice({ total: 100, quantity: 4 })).toBe(25);
  });
});

describe('calculateBuyerShare', () => {
  it('sums share * unitPrice across products', () => {
    const receipt = {
      products: [
        { total: 100, quantity: 4, distribution: { a: 1, b: 3 } }, // unitPrice 25 → a=25, b=75
        { total: 50, quantity: 5, distribution: { a: 2, b: 3 } },  // unitPrice 10 → a=20, b=30
      ],
    };
    expect(calculateBuyerShare('a', receipt)).toBe(45);
    expect(calculateBuyerShare('b', receipt)).toBe(105);
  });
});

describe('calculateReceiptTotal', () => {
  it('sums product totals', () => {
    expect(calculateReceiptTotal({ products: [{ total: 10 }, { total: 20 }] })).toBe(30);
  });
});
