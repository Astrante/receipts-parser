import { useState } from 'react';
import { useReceiptStore } from '../../store/receiptStore.js';
import { ReceiptParserService } from '../../core/services/ReceiptParser.js';
import { importReceiptFromJSON } from '../../core/utils/receiptShare.js';
import { uuid } from '../../core/utils/uuid.js';
import { getUserFriendlyError } from '../../core/utils/errors.js';

const IMPORT_ERROR_MESSAGE = 'Failed to import receipt. Please check the file format.';

/**
 * Добавление чека в store из разных источников — URL QR-кода или JSON-файл.
 *
 * Владеет состоянием обработки (isProcessing) и ошибки (error) и инкапсулирует
 * поток parse/import → addReceipt, который раньше дублировался между
 * ScanBottomSheet, AddByLinkBottomSheet и ImportBottomSheet.
 *
 * Возвращает:
 *   isProcessing, error, setError — для отображения в UI;
 *   addFromUrl(url, storeName)    — парсит чек по ссылке, добавляет, возвращает receipt;
 *   addFromJsonFile(file)         — импортирует чек из JSON, добавляет, возвращает receipt.
 * При ошибке выставляется понятное сообщение в error, а сам промис реджектится —
 * вызывающий компонент может молча проигнорировать его (состояние уже обновлено).
 */
export function useAddReceipt() {
  const addReceipt = useReceiptStore((s) => s.addReceipt);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const addFromUrl = async (url, storeName = null) => {
    setError(null);
    setIsProcessing(true);
    try {
      const parser = new ReceiptParserService();
      const receipt = await parser.parseFromUrl(url, storeName?.trim() || null);
      addReceipt(receipt);
      return receipt;
    } catch (err) {
      console.error('Parse error:', err);
      setError(getUserFriendlyError(err.message));
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const addFromJsonFile = async (file) => {
    setError(null);
    setIsProcessing(true);
    try {
      const imported = await importReceiptFromJSON(file);
      const receipt = {
        ...imported,
        id: uuid(),
        importedAt: new Date().toISOString(),
      };
      addReceipt(receipt);
      return receipt;
    } catch (err) {
      console.error('Import error:', err);
      setError(IMPORT_ERROR_MESSAGE);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, error, setError, addFromUrl, addFromJsonFile };
}
