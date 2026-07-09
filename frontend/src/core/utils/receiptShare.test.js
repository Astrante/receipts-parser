import { describe, it, expect } from 'vitest';
import { encodeReceipt, decodeReceipt } from './receiptShare.js';

describe('encodeReceipt / decodeReceipt', () => {
  it('round-trips a receipt with Cyrillic text', () => {
    const receipt = { id: '1', storeName: 'Макси Ћ', totalAmount: 123.45 };
    const encoded = encodeReceipt(receipt);
    expect(typeof encoded).toBe('string');
    expect(decodeReceipt(encoded)).toEqual(receipt);
  });
});
