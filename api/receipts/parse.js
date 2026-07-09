/**
 * Vercel Serverless Function
 * POST /api/receipts/parse
 *
 * Проксирование запроса к сербской системе suf.purs.gov.rs и обход CORS.
 * Сам парсинг живёт в backend/src/services/receiptParser.js — единственная
 * реализация, общая для этой Vercel-функции и локального Express-прокси.
 */
import { parseReceiptFromURL } from '../../backend/src/services/receiptParser.js';

const CLIENT_ERRORS = new Set([
  'URL is required',
  'Invalid receipt URL',
  'Failed to fetch receipt page',
  'Failed to parse receipt data from HTML',
  'Failed to fetch receipt specifications',
  'Invalid receipt data format',
]);

export default async function handler(req, res) {
  // CORS headers (без credentials — см. политику CORS в CLAUDE.md)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    const result = await parseReceiptFromURL(url);
    res.json(result);
  } catch (error) {
    const message = error.message || 'Failed to fetch receipt data';
    const status = CLIENT_ERRORS.has(message) ? 400 : 500;
    console.error('Proxy error:', error);
    res.status(status).json({ error: message });
  }
}
