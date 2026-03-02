import { createReceipt } from '../domain/Receipt.js';
import { apiClient } from './apiClient.js';

/**
 * Сервис для парсинга чеков
 */
export class ReceiptParserService {
  /**
   * Парсит чек по URL
   * @param {string} url - URL чека
   * @param {string} storeName - Опциональное название магазина
   * @returns {Promise<Receipt>}
   */
  async parseFromUrl(url, storeName = null) {
    const response = await apiClient.parseReceipt(url);

    if (!response.success) {
      const errorMessage = response.debug
        ? `${response.error} (Debug: ${JSON.stringify(response.debug)})`
        : response.error;
      throw new Error(errorMessage || 'Failed to parse receipt');
    }

    return createReceipt({
      ...response.data,
      storeName: storeName || response.data.storeName,
      originalUrl: url
    });
  }
}
