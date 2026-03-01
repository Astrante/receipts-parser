import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReceiptRepository } from '../core/repositories/ReceiptRepository.js';

/**
 * Zustand store для управления состоянием чеков
 */
export const useReceiptStore = create(
  persist(
    (set, get) => ({
      // State
      receipts: [],
      activeReceipt: null,
      isLoading: false,
      error: null,

      // Actions
      /**
       * Загружает чеки из localStorage
       */
      loadReceipts: () => {
        const receipts = ReceiptRepository.findAll();
        set({ receipts });
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
    }),
    {
      name: 'receipt-storage',
      partialize: (state) => ({ receipts: state.receipts })
    }
  )
);
