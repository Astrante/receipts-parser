/**
 * Канонический парсер сербских чеков из системы suf.purs.gov.rs.
 *
 * Единственная реализация парсинга: используется и локальным Express-прокси
 * (backend/src/proxy/receiptProxy.js), и Vercel serverless-функцией
 * (api/receipts/parse.js). Раньше логика дублировалась в трёх местах и они
 * разошлись (prod извлекал название магазина и дату, dev — нет).
 *
 * Сетевые запросы отделены от парсинга: функции extract и buildReceipt —
 * чистые и покрываются юнит-тестами с фикстурами (см. receiptParser.test.js).
 *
 * @module receiptParser
 */

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'sr-RS,sr;q=0.9,en-US;q=0.8,en;q=0.7',
};

/** Декодирует HTML-entities (например &#x421; → С). */
const decodeHtmlEntities = (str) => str
  .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));

/**
 * Извлекает invoiceNumber и token из HTML страницы чека.
 * @param {string} html
 * @returns {{ invoiceNumber: string, token: string }}
 * @throws {Error} 'Failed to parse receipt data from HTML' если шаблоны не найдены
 */
export const extractInvoiceAndToken = (html) => {
  const invoiceMatch = html.match(/viewModel\.InvoiceNumber\('([^']+)'\)/);
  const tokenMatch = html.match(/viewModel\.Token\('([^']+)'\)/);
  if (!invoiceMatch || !tokenMatch) {
    throw new Error('Failed to parse receipt data from HTML');
  }
  return { invoiceNumber: invoiceMatch[1], token: tokenMatch[1] };
};

/**
 * Извлекает название магазина из shopFullNameLabel с декодированием entities.
 * @param {string} html
 * @returns {string} название магазина либо запасное 'Receipt from SUF system'
 */
export const extractStoreName = (html) => {
  const match = html.match(/<span[^>]*id="shopFullNameLabel"[^>]*>([^<]+)<\/span>/);
  return match ? decodeHtmlEntities(match[1].trim()) : 'Receipt from SUF system';
};

/**
 * Извлекает дату/время из sdcDateTimeLabel (формат d.m.yyyy. HH:MM:SS).
 * @param {string} html
 * @returns {Date|null} дата либо null, если не найдена
 */
export const extractDate = (html) => {
  const match = html.match(/<span[^>]*id="sdcDateTimeLabel"[^>]*>[\s\S]*?(\d{1,2})\.(\d{1,2})\.(\d{4})\.\s*(\d{1,2}):(\d{1,2}):(\d{1,2})/);
  if (!match) return null;
  const [, day, month, year, hour, minute, second] = match;
  return new Date(year, month - 1, day, hour, minute, second);
};

/**
 * Собирает итоговый объект чека из распарсенных HTML-данных и ответа /specifications.
 * @param {{ invoiceNumber: string, storeName: string, date: Date|null, specsData: Object }} input
 * @returns {{ success: true, data: Object }}
 * @throws {Error} 'Invalid receipt data format' если specsData некорректен
 */
export const buildReceipt = ({ invoiceNumber, storeName, date, specsData }) => {
  if (!specsData.success || !specsData.items) {
    throw new Error('Invalid receipt data format');
  }
  return {
    success: true,
    data: {
      invoiceNumber,
      storeName,
      date: (date ?? new Date()).toISOString(),
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
};

/**
 * Парсит чек по URL QR-кода: загружает HTML, извлекает invoiceNumber/token/
 * магазин/дату, затем детали продуктов, и возвращает структурированный чек.
 *
 * @param {string} url - URL чека (https://suf.purs.gov.rs/v/?vl=...)
 * @returns {Promise<{ success: true, data: Object }>}
 * @throws {Error} с понятным сообщением (URL is required / Invalid receipt URL /
 *   Failed to fetch receipt page / Failed to parse receipt data from HTML /
 *   Failed to fetch receipt specifications / Invalid receipt data format)
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
  const htmlResponse = await fetch(`https://suf.purs.gov.rs/v/?vl=${vlParam}`, {
    headers: BROWSER_HEADERS,
  });
  if (!htmlResponse.ok) {
    throw new Error('Failed to fetch receipt page');
  }
  const html = await htmlResponse.text();

  // 3. Извлечь invoiceNumber, token, название магазина и дату из HTML
  const { invoiceNumber, token } = extractInvoiceAndToken(html);
  const storeName = extractStoreName(html);
  const date = extractDate(html);

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

  // 5. Собрать структурированные данные
  const specsData = await specsResponse.json();
  return buildReceipt({ invoiceNumber, storeName, date, specsData });
}
