/**
 * Канонический парсер сербских чеков из системы suf.purs.gov.rs.
 *
 * Единственная реализация парсинга: используется и локальным Express-прокси
 * (backend/src/proxy/receiptProxy.js), и Vercel serverless-функцией
 * (api/receipts/parse.js). Раньше логика дублировалась в трёх местах и они
 * разошлись (prod извлекал название магазина и дату, dev — нет).
 *
 * @param {string} url - URL чека с QR-кода (https://suf.purs.gov.rs/v/?vl=...)
 * @returns {Promise<{ success: true, data: Object }>} структурированный чек
 * @throws {Error} с понятным сообщением при ошибке (URL is required / Invalid
 *   receipt URL / Failed to fetch receipt page / ... ) — обработчик сам решает,
 *   какой HTTP-статус вернуть.
 */
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'sr-RS,sr;q=0.9,en-US;q=0.8,en;q=0.7',
};

/** Декодирует HTML-entities (например &#x421; → Ћ). */
const decodeHtmlEntities = (str) => str
  .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));

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
  const htmlResponse = await fetch(`https://suf.purs.gov.rs/v/?vl=${vlParam}`, {
    headers: BROWSER_HEADERS,
  });
  if (!htmlResponse.ok) {
    throw new Error('Failed to fetch receipt page');
  }
  const html = await htmlResponse.text();

  // 3. Извлечь invoiceNumber, token, название магазина и дату из HTML
  const invoiceMatch = html.match(/viewModel\.InvoiceNumber\('([^']+)'\)/);
  const tokenMatch = html.match(/viewModel\.Token\('([^']+)'\)/);
  const storeNameMatch = html.match(/<span[^>]*id="shopFullNameLabel"[^>]*>([^<]+)<\/span>/);
  const dateMatch = html.match(/<span[^>]*id="sdcDateTimeLabel"[^>]*>[\s\S]*?(\d{1,2})\.(\d{1,2})\.(\d{4})\.\s*(\d{1,2}):(\d{1,2}):(\d{1,2})/);

  if (!invoiceMatch || !tokenMatch) {
    throw new Error('Failed to parse receipt data from HTML');
  }

  const invoiceNumber = invoiceMatch[1];
  const token = tokenMatch[1];
  const storeName = storeNameMatch
    ? decodeHtmlEntities(storeNameMatch[1].trim())
    : 'Receipt from SUF system';

  let receiptDate = new Date();
  if (dateMatch) {
    const [, day, month, year, hour, minute, second] = dateMatch;
    receiptDate = new Date(year, month - 1, day, hour, minute, second);
  }

  // 4. Получить детали продуктов
  const specsResponse = await fetch('https://suf.purs.gov.rs/specifications', {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
    },
    body: `invoiceNumber=${encodeURIComponent(invoiceNumber)}&token=${encodeURIComponent(token)}`,
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
      storeName,
      date: receiptDate.toISOString(),
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
