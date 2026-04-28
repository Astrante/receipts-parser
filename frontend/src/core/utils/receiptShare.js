/**
 * Кодирует данные чека для передачи через URL
 * @param {Object} receipt - Данные чека
 * @returns {string} Закодированная строка
 */
export function encodeReceipt(receipt) {
  try {
    const jsonString = JSON.stringify(receipt);
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    return base64;
  } catch (error) {
    console.error('Failed to encode receipt:', error);
    throw new Error('Failed to encode receipt data');
  }
}

/**
 * Декодирует данные чека из URL
 * @param {string} encoded - Закодированная строка
 * @returns {Object} Данные чека
 */
export function decodeReceipt(encoded) {
  try {
    const jsonString = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to decode receipt:', error);
    throw new Error('Failed to decode receipt data');
  }
}

/**
 * Генерирует ссылку для分享 чека
 * @param {Object} receipt - Данные чека
 * @param {string} baseUrl - Базовый URL приложения
 * @returns {string} Полная ссылка для分享
 */
export function generateShareUrl(receipt, baseUrl = window.location.origin) {
  const encoded = encodeReceipt(receipt);
  return `${baseUrl}/shared/${encoded}`;
}

/**
 * Экспортирует чек в JSON файл
 * @param {Object} receipt - Данные чека
 */
export function exportReceiptToJSON(receipt) {
  try {
    const jsonString = JSON.stringify(receipt, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${receipt.id || 'export'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export receipt:', error);
    throw new Error('Failed to export receipt');
  }
}

/**
 * Импортирует чек из JSON файла
 * @param {File} file - Файл для импорта
 * @returns {Promise<Object>} Данные чека
 */
export function importReceiptFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const receipt = JSON.parse(e.target.result);
        resolve(receipt);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
