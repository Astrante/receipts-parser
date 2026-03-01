/**
 * Адаптер для localStorage с сериализацией
 */
export class LocalStorageAdapter {
  constructor(key = 'receipt_parser_data') {
    this.key = key;
  }

  /**
   * Получает данные из localStorage
   * @returns {Array}
   */
  get() {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data, (key, value) => {
        // Десериализуем Date объекты
        if (typeof value === 'string' && (
          key.endsWith('Date') ||
          key.endsWith('At') ||
          key === 'date' ||
          key === 'createdAt'
        )) {
          const date = new Date(value);
          return !isNaN(date.getTime()) ? date : value;
        }
        return value;
      }) : [];
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return [];
    }
  }

  /**
   * Сохраняет данные в localStorage
   * @param {Array} data
   */
  set(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to write to localStorage:', error);
    }
  }

  /**
   * Очищает localStorage
   */
  clear() {
    localStorage.removeItem(this.key);
  }
}
