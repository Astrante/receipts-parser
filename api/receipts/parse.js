/**
 * Vercel Serverless Function
 * POST /api/receipts/parse
 *
 * Proxy для получения данных чека с suf.purs.gov.rs
 * Обходит CORS ограничения браузера
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // 1. Извлечь vl параметр из URL
    const urlObj = new URL(url);
    const vlParam = urlObj.searchParams.get('vl');

    if (!vlParam) {
      return res.status(400).json({ error: 'Invalid receipt URL' });
    }

    // 2. Загрузить HTML страницу
    const htmlResponse = await fetch(`https://suf.purs.gov.rs/v/?vl=${vlParam}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'sr-RS,sr;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    if (!htmlResponse.ok) {
      return res.status(400).json({ error: 'Failed to fetch receipt page' });
    }
    const html = await htmlResponse.text();

    // 3. Извлечь invoiceNumber, token, locationName и date из HTML
    const invoiceMatch = html.match(/viewModel\.InvoiceNumber\('([^']+)'\)/);
    const tokenMatch = html.match(/viewModel\.Token\('([^']+)'\)/);

    // Extract store name from shopFullNameLabel span
    const storeNameMatch = html.match(/<span[^>]*id="shopFullNameLabel"[^>]*>([^<]+)<\/span>/);
    // Extract date from sdcDateTimeLabel span (format: d.m.yyyy. HH:ii:ss)
    const dateMatch = html.match(/<span[^>]*id="sdcDateTimeLabel"[^>]*>[\s\S]*?(\d{1,2})\.(\d{1,2})\.(\d{4})\.\s*(\d{1,2}):(\d{1,2}):(\d{1,2})/);

    if (!invoiceMatch || !tokenMatch) {
      return res.status(400).json({ error: 'Failed to parse receipt data from HTML' });
    }

    const invoiceNumber = invoiceMatch[1];
    const token = tokenMatch[1];

    // Декодируем HTML entities (например &#x421; → Ћ)
    const decodeHtmlEntities = (str) => {
      return str
        .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));
    };

    const locationName = storeNameMatch
      ? decodeHtmlEntities(storeNameMatch[1].trim())
      : 'Receipt from SUF system';

    console.log('Date match result:', dateMatch);

    let receiptDate = new Date();
    if (dateMatch) {
      const [, day, month, year, hour, minute, second] = dateMatch;
      receiptDate = new Date(year, month - 1, day, hour, minute, second);
      console.log('Parsed date:', { day, month, year, hour, minute, second, result: receiptDate });
    } else {
      console.log('Date not found, using current date');
    }

    // 4. Получить детали продуктов
    const specsResponse = await fetch('https://suf.purs.gov.rs/specifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
      },
      body: `invoiceNumber=${encodeURIComponent(invoiceNumber)}&token=${encodeURIComponent(token)}`
    });

    if (!specsResponse.ok) {
      return res.status(400).json({ error: 'Failed to fetch receipt specifications' });
    }

    const specsData = await specsResponse.json();

    console.log('Specs data:', {
      success: specsData.success,
      hasItems: !!specsData.items,
      itemCount: specsData.items?.length,
      keys: Object.keys(specsData),
      fullData: JSON.stringify(specsData).substring(0, 500)
    });

    if (!specsData.success || !specsData.items) {
      return res.status(400).json({
        error: 'Invalid receipt data format',
        debug: {
          success: specsData.success,
          hasItems: !!specsData.items,
          itemCount: specsData.items?.length,
          keys: Object.keys(specsData)
        }
      });
    }

    // 5. Вернуть структурированные данные
    res.json({
      success: true,
      data: {
        invoiceNumber,
        storeName: locationName,
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
    });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch receipt data', message: error.message });
  }
}
