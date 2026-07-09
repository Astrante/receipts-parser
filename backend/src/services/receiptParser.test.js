import { describe, it, expect } from 'vitest';
import {
  extractInvoiceAndToken,
  extractStoreName,
  extractDate,
  buildReceipt,
} from './receiptParser.js';

// Минимальный фикстурный HTML в форме, которую отдаёт suf.purs.gov.rs.
const HTML = `
<html>
<script>
  viewModel.InvoiceNumber('W36A-W36A-57520');
  viewModel.Token('tok-123');
</script>
<span id="shopFullNameLabel">Maxi &#x421; Shop</span>
<span id="sdcDateTimeLabel">01.03.2026. 18:00:00</span>
</html>
`;

describe('extractInvoiceAndToken', () => {
  it('extracts invoice number and token', () => {
    expect(extractInvoiceAndToken(HTML)).toEqual({
      invoiceNumber: 'W36A-W36A-57520',
      token: 'tok-123',
    });
  });

  it('throws when viewmodel patterns are missing', () => {
    expect(() => extractInvoiceAndToken('<html>no viewmodel here</html>')).toThrow(
      'Failed to parse receipt data from HTML'
    );
  });
});

describe('extractStoreName', () => {
  it('decodes HTML entities', () => {
    // &#x421; → U+0421 CYRILLIC CAPITAL LETTER ES
    expect(extractStoreName(HTML)).toBe('Maxi С Shop');
  });

  it('falls back to the default when label is missing', () => {
    expect(extractStoreName('<html></html>')).toBe('Receipt from SUF system');
  });
});

describe('extractDate', () => {
  it('parses d.m.yyyy. HH:MM:SS', () => {
    expect(extractDate(HTML)).toEqual(new Date(2026, 2, 1, 18, 0, 0));
  });

  it('returns null when the date label is missing', () => {
    expect(extractDate('<html></html>')).toBeNull();
  });
});

describe('buildReceipt', () => {
  const specsData = {
    success: true,
    items: [
      { name: 'Banane/KG/008', quantity: 0.5, unitPrice: 180, total: 90, labelRate: 10, vatAmount: 9 },
      { name: 'Hleb/KOM/9', quantity: 2, unitPrice: 50, total: 100, labelRate: 20, vatAmount: 16.67 },
    ],
  };

  it('maps items, infers units, and sums totals', () => {
    const result = buildReceipt({
      invoiceNumber: 'INV',
      storeName: 'Maxi',
      date: new Date(2026, 2, 1, 18, 0, 0),
      specsData,
    });

    expect(result.success).toBe(true);
    expect(result.data.invoiceNumber).toBe('INV');
    expect(result.data.storeName).toBe('Maxi');
    expect(result.data.products).toHaveLength(2);
    expect(result.data.products[0].unit).toBe('KG');
    expect(result.data.products[1].unit).toBe('KOM');
    expect(result.data.totalAmount).toBeCloseTo(190);
    expect(result.data.taxAmount).toBeCloseTo(25.67);
  });

  it('uses the current time when date is null', () => {
    const before = Date.now();
    const result = buildReceipt({ invoiceNumber: 'INV', storeName: 'X', date: null, specsData });
    const after = Date.now();
    const ts = new Date(result.data.date).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('throws on invalid specs', () => {
    expect(() =>
      buildReceipt({ invoiceNumber: 'INV', storeName: 'X', date: null, specsData: { success: false } })
    ).toThrow('Invalid receipt data format');
  });
});
