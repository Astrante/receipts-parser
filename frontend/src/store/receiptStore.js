import { create } from 'zustand';
import { ReceiptRepository } from '../core/repositories/ReceiptRepository.js';

/**
 * One-time migration from the legacy Zustand `persist` key.
 *
 * Раньше чеки дублировались в два ключа localStorage: `receipts` (через
 * ReceiptRepository) и `receipt-storage` (через zustand persist). Теперь
 * ReceiptRepository — единственный источник правды, ключ `receipt-storage`
 * больше не нужен. Если канонический ключ пуст, а в legacy есть данные —
 * импортируем их, затем удаляем мёртвый ключ.
 */
const migrateLegacyPersistedReceipts = () => {
  try {
    const legacy = localStorage.getItem('receipt-storage');
    if (!legacy) return;

    const parsed = JSON.parse(legacy);
    const legacyReceipts = parsed?.state?.receipts;
    const current = ReceiptRepository.findAll();

    if (
      (!current || current.length === 0) &&
      Array.isArray(legacyReceipts) &&
      legacyReceipts.length > 0
    ) {
      legacyReceipts.forEach((r) => ReceiptRepository.save(r));
    }

    localStorage.removeItem('receipt-storage');
  } catch {
    // Повреждённый legacy-ключ — игнорируем, данные остаются в `receipts`.
  }
};

migrateLegacyPersistedReceipts();

/**
 * Zustand store для управления состоянием чеков.
 *
 * ReceiptRepository (ключ localStorage `receipts`) — единственный источник
 * правды: все действия пишут через него, а состояние инициализируется из него
 * синхронно при создании store.
 */
export const useReceiptStore = create((set) => ({
  // State
  receipts: ReceiptRepository.findAll(),
  activeReceipt: null,
  isLoading: false,
  error: null,

  // Actions
  /**
   * Перезагружает чеки из localStorage
   */
  loadReceipts: () => {
    set({ receipts: ReceiptRepository.findAll() });
  },

  /**
   * Добавляет новый чек
   */
  addReceipt: (receipt) => {
    ReceiptRepository.save(receipt);
    set((state) => ({ receipts: [...state.receipts, receipt] }));
  },

  /**
   * Устанавливает активный чек
   */
  setActiveReceipt: (id) => {
    const receipt = ReceiptRepository.findById(id);
    set({ activeReceipt: receipt });
  },

  /**
   * Обновляет список покупателей чека
   */
  updateBuyers: (receiptId, buyers) => {
    const receipt = ReceiptRepository.findById(receiptId);
    if (receipt) {
      const updated = { ...receipt, buyers };
      ReceiptRepository.update(updated);
      set((state) => ({
        receipts: state.receipts.map(r =>
          r.id === receiptId ? updated : r
        ),
        activeReceipt: state.activeReceipt?.id === receiptId
          ? updated
          : state.activeReceipt
      }));
    }
  },

  /**
   * Обновляет название магазина
   */
  updateStoreName: (receiptId, storeName) => {
    const receipt = ReceiptRepository.findById(receiptId);
    if (receipt) {
      const updated = { ...receipt, storeName };
      ReceiptRepository.update(updated);
      set((state) => ({
        receipts: state.receipts.map(r =>
          r.id === receiptId ? updated : r
        ),
        activeReceipt: state.activeReceipt?.id === receiptId
          ? updated
          : state.activeReceipt
      }));
    }
  },

  /**
   * Обновляет распределение продуктов
   */
  updateProductDistribution: (receiptId, productId, distribution) => {
    const receipt = ReceiptRepository.findById(receiptId);
    if (receipt) {
      const updated = {
        ...receipt,
        products: receipt.products.map(p =>
          p.id === productId
            ? { ...p, distribution }
            : p
        )
      };
      ReceiptRepository.update(updated);
      set((state) => ({
        receipts: state.receipts.map(r =>
          r.id === receiptId ? updated : r
        ),
        activeReceipt: state.activeReceipt?.id === receiptId
          ? updated
          : state.activeReceipt
      }));
    }
  },

  /**
   * Устанавливает состояние загрузки
   */
  setLoading: (isLoading) => set({ isLoading }),

  /**
   * Устанавливает ошибку
   */
  setError: (error) => set({ error }),

  /**
   * Очищает ошибку
   */
  clearError: () => set({ error: null }),

  /**
   * Удаляет чек
   */
  deleteReceipt: (id) => {
    ReceiptRepository.delete(id);
    set((state) => ({
      receipts: state.receipts.filter(r => r.id !== id),
      activeReceipt: state.activeReceipt?.id === id ? null : state.activeReceipt
    }));
  }
}));
