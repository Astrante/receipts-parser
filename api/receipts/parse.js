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
    const htmlResponse = await fetch(`https://suf.purs.gov.rs/v/?vl=${vlParam}`);
    if (!htmlResponse.ok) {
      return res.status(400).json({ error: 'Failed to fetch receipt page' });
    }
    const html = await htmlResponse.text();

    // 3. Извлечь invoiceNumber и token из HTML
    const invoiceMatch = html.match(/viewModel\.InvoiceNumber\('([^']+)'\)/);
    const tokenMatch = html.match(/viewModel\.Token\('([^']+)'\)/);

    if (!invoiceMatch || !tokenMatch) {
      return res.status(400).json({ error: 'Failed to parse receipt data from HTML' });
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
      return res.status(400).json({ error: 'Failed to fetch receipt specifications' });
    }

    const specsData = await specsResponse.json();

    if (!specsData.success || !specsData.items) {
      return res.status(400).json({ error: 'Invalid receipt data format' });
    }

    // 5. Вернуть структурированные данные
    res.json({
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
    });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch receipt data', message: error.message });
  }
}
