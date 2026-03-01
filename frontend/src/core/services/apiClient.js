// Если VITE_BACKEND_URL пустой (на Vercel), используем относительный путь
// На localhost: http://localhost:3001
// На Vercel: /api (тот же домен)
const API_BASE = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '') // Убираем слеш в конце, если есть
  : (import.meta.env.PROD ? '/api' : 'http://localhost:3001');

/**
 * API клиент для взаимодействия с backend
 */
export const apiClient = {
  /**
   * Отправляет URL чека для парсинга
   * @param {string} url - URL чека с QR кода
   * @returns {Promise<Object>}
   */
  async parseReceipt(url) {
    // Если API_BASE уже включает /api, не добавляем ещё раз
    const apiUrl = API_BASE.endsWith('/api')
      ? `${API_BASE}/receipts/parse`
      : `${API_BASE}/api/receipts/parse`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to parse receipt');
    }

    return response.json();
  }
};
