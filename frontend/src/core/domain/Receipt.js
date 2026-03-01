import { createProduct } from './Product.js';
import { createBuyer } from './Buyer.js';

/**
 * Создаёт новую сущность Receipt
 * @param {Object} data - Данные чека
 * @returns {Receipt}
 */
export function createReceipt(data) {
  return {
    id: crypto.randomUUID(),
    storeName: data.storeName || 'Unknown Store',
    date: new Date(data.date),
    invoiceNumber: data.invoiceNumber || '',
    products: (data.products || []).map(p => createProduct(p)),
    buyers: (data.buyers || []).map(b => createBuyer(b)),
    totalAmount: data.totalAmount || 0,
    taxAmount: data.taxAmount || 0,
    originalUrl: data.originalUrl || '',
    createdAt: new Date()
  };
}

/**
 * Вычисляет общую сумму чека
 * @param {Receipt} receipt
 * @returns {number}
 */
export function calculateReceiptTotal(receipt) {
  return receipt.products.reduce((sum, p) => sum + p.total, 0);
}
