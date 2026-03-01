import { LocalStorageAdapter } from './StorageAdapter.js';

const storage = new LocalStorageAdapter('buyers');

/**
 * Repository для управления покупателями
 */
export const BuyerRepository = {
  /**
   * Получает всех покупателей
   */
  findAll() {
    return storage.get();
  },

  /**
   * Сохраняет покупателя
   */
  save(buyer) {
    const buyers = storage.get();
    const existing = buyers.find(b => b.name === buyer.name);

    if (!existing) {
      buyers.push(buyer);
      storage.set(buyers);
    }

    return buyer;
  },

  /**
   * Находит покупателя по ID
   */
  findById(id) {
    return storage.get().find(b => b.id === id) || null;
  },

  /**
   * Обновляет покупателя
   */
  update(updatedBuyer) {
    const buyers = storage.get().map(b =>
      b.id === updatedBuyer.id ? updatedBuyer : b
    );
    storage.set(buyers);
  },

  /**
   * Удаляет покупателя
   */
  delete(id) {
    const buyers = storage.get().filter(b => b.id !== id);
    storage.set(buyers);
  }
};
