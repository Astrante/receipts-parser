import { LocalStorageAdapter } from './StorageAdapter.js';

const storage = new LocalStorageAdapter('receipts');

/**
 * Repository для работы с чеками
 */
export const ReceiptRepository = {
  /**
   * Получает все чеки
   * @returns {Array<Receipt>}
   */
  findAll() {
    return storage.get();
  },

  /**
   * Сохраняет чек
   * @param {Receipt} receipt
   */
  save(receipt) {
    const receipts = storage.get();
    receipts.push(receipt);
    storage.set(receipts);
  },

  /**
   * Находит чек по ID
   * @param {string} id
   * @returns {Receipt|null}
   */
  findById(id) {
    return storage.get().find(r => r.id === id) || null;
  },

  /**
   * Обновляет чек
   * @param {Receipt} updatedReceipt
   */
  update(updatedReceipt) {
    const receipts = storage.get().map(r =>
      r.id === updatedReceipt.id ? updatedReceipt : r
    );
    storage.set(receipts);
  },

  /**
   * Удаляет чек
   * @param {string} id
   */
  delete(id) {
    const receipts = storage.get().filter(r => r.id !== id);
    storage.set(receipts);
  }
};
