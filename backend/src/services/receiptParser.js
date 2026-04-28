/**
 * Парсит данные чека из Serbian government API
 * @param {string} url - URL чека с QR кода
 * @returns {Promise<Object>} - Данные чека
 */
export async function parseReceiptFromURL(url) {
  if (!url) {
    throw new Error('URL is required');
  }

  // 1. Извлечь vl параметр из URL
  const urlObj = new URL(url);
  const vlParam = urlObj.searchParams.get('vl');

  if (!vlParam) {
    throw new Error('Invalid receipt URL');
  }

  // 2. Загрузить HTML страницу
  const htmlResponse = await fetch(`https://suf.purs.gov.rs/v/?vl=${vlParam}`);
  if (!htmlResponse.ok) {
    throw new Error('Failed to fetch receipt page');
  }
  const html = await htmlResponse.text();

  // 3. Извлечь invoiceNumber и token из HTML
  const invoiceMatch = html.match(/viewModel\.InvoiceNumber\('([^']+)'\)/);
  const tokenMatch = html.match(/viewModel\.Token\('([^']+)'\)/);

  if (!invoiceMatch || !tokenMatch) {
    throw new Error('Failed to parse receipt data from HTML');
  }

  const invoiceNumber = invoiceMatch[1];
  const token = tokenMatch[1];

  // 4. Получить детали продуктов
  const specsResponse = await fetch('https://suf.purs.gov.rs/specifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `invoiceNumber=${encodeURIComponent(invoiceNumber)}&token=${encodeURIComponent(token)}`
  });

  if (!specsResponse.ok) {
    throw new Error('Failed to fetch receipt specifications');
  }

  const specsData = await specsResponse.json();

  if (!specsData.success || !specsData.items) {
    throw new Error('Invalid receipt data format');
  }

  // 5. Вернуть структурированные данные
  return {
    success: true,
    data: {
      invoiceNumber,
      storeName: 'Receipt from SUF system',
      date: new Date().toISOString(),
      products: specsData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.name.includes('/KG/') ? 'KG' : 'KOM',
        unitPrice: item.unitPrice,
        total: item.total,
        taxRate: item.labelRate
      })),
      totalAmount: specsData.items.reduce((sum, item) => sum + item.total, 0),
      taxAmount: specsData.items.reduce((sum, item) => sum + (item.vatAmount || 0), 0)
    }
  };
}
