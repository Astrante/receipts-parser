import express from 'express';
import { parseReceiptFromURL } from '../services/receiptParser.js';

const router = express.Router();

/**
 * POST /api/receipts/parse
 * Proxy для получения данных чека с suf.purs.gov.rs
 */
router.post('/parse', async (req, res) => {
  try {
    const { url } = req.body;
    const result = await parseReceiptFromURL(url);
    res.json(result);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch receipt data', message: error.message });
  }
});

export default router;
