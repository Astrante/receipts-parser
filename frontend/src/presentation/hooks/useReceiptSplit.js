import { useState } from 'react';
import { useReceiptStore } from '../../store/receiptStore.js';
import { createBuyer } from '../../core/domain/Buyer.js';
import { reconcileDistribution } from '../../core/domain/Product.js';
import { BuyerRepository } from '../../core/repositories/BuyerRepository.js';
import { parseAmount } from '../../core/utils/number.js';

/**
 * Общая логика разделения чека между покупателями.
 *
 * Раньше дублировалась между SplitReceipt и ReceiptDetail (~200 строк),
 * из-за чего баги (например iOS decimal) приходилось править сразу в двух
 * местах. Хук владеет состоянием ввода и операциями над распределением;
 * компоненты занимаются только отображением.
 *
 * @param {string} id - ID чека
 */
export function useReceiptSplit(id) {
  const { receipts, updateBuyers, updateProductDistribution } = useReceiptStore();
  const receipt = receipts.find(r => r.id === id) || null;

  const [newBuyerName, setNewBuyerName] = useState('');
  const [savedBuyers, setSavedBuyers] = useState(() => BuyerRepository.findAll());
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);

  // Временные значения для input полей (чтобы можно было вводить)
  const [tempInputValues, setTempInputValues] = useState({});

  const addBuyer = () => {
    if (!newBuyerName.trim()) return;

    const currentBuyers = receipt.buyers || [];

    const newBuyer = createBuyer({ name: newBuyerName.trim() });
    const updatedBuyers = [...currentBuyers, newBuyer];

    BuyerRepository.save(newBuyer);
    setSavedBuyers(BuyerRepository.findAll());

    if (currentBuyers.length === 0) {
      const updatedProducts = receipt.products.map(product => ({
        ...product,
        distribution: { [newBuyer.id]: product.quantity }
      }));

      updateBuyers(receipt.id, updatedBuyers);
      updatedProducts.forEach(product => {
        updateProductDistribution(receipt.id, product.id, product.distribution);
      });
    } else {
      updateBuyers(receipt.id, updatedBuyers);
    }

    setNewBuyerName('');
    setShowBuyerDropdown(false);
  };

  const selectBuyer = (buyer) => {
    setNewBuyerName(buyer.name);
    setShowBuyerDropdown(false);
  };

  const updateDistribution = (productId, buyerId, newValue) => {
    const product = receipt.products.find(p => p.id === productId);
    const currentDist = product.distribution || {};
    const buyers = receipt.buyers || [];

    if (buyers.length === 0) return;

    const parsedValue = parseAmount(newValue);
    const oldValue = currentDist[buyerId] || 0;
    const difference = parsedValue - oldValue;

    // Если значение не изменилось, ничего не делаем
    if (difference === 0) return;

    let newDistribution = { ...currentDist };
    newDistribution[buyerId] = parsedValue;

    if (difference > 0) {
      // Увеличиваем - забираем у остальных
      const firstBuyerId = buyers[0].id;
      let needed = difference;

      if (buyerId === firstBuyerId) {
        // Первый покупатель увеличивает - забираем в обратном порядке (с последнего)
        const otherBuyers = buyers.filter(b => b.id !== buyerId).reverse();
        for (const otherBuyer of otherBuyers) {
          if (needed <= 0) break;
          const otherValue = newDistribution[otherBuyer.id] || 0;
          const canTake = Math.min(otherValue, needed);
          newDistribution[otherBuyer.id] = otherValue - canTake;
          needed -= canTake;
        }
      } else {
        // Не первый покупатель увеличивает - забираем у первого, потом у остальных по порядку
        const otherBuyers = buyers.filter(b => b.id !== buyerId);
        for (const otherBuyer of otherBuyers) {
          if (needed <= 0) break;
          const otherValue = newDistribution[otherBuyer.id] || 0;
          const canTake = Math.min(otherValue, needed);
          newDistribution[otherBuyer.id] = otherValue - canTake;
          needed -= canTake;
        }
      }

      // Если не хватило, ограничиваем текущее значение
      if (needed > 0) {
        newDistribution[buyerId] = oldValue + (difference - needed);
      }
    } else {
      // Уменьшаем - отдаём первому покупателю
      const firstBuyerId = buyers[0].id;
      const excess = Math.abs(difference);
      newDistribution[firstBuyerId] = (newDistribution[firstBuyerId] || 0) + excess;
    }

    const finalDistribution = reconcileDistribution(newDistribution, buyers, product.quantity);
    updateProductDistribution(receipt.id, productId, finalDistribution);
  };

  const handleInputChange = (productId, buyerId, value) => {
    const key = `${productId}-${buyerId}`;
    setTempInputValues(prev => ({ ...prev, [key]: value }));
  };

  const handleBlur = (productId, buyerId, inputValue) => {
    const key = `${productId}-${buyerId}`;
    // Очищаем временное значение
    setTempInputValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });

    const product = receipt.products.find(p => p.id === productId);
    const currentDist = product.distribution || {};
    const oldValue = currentDist[buyerId] || 0;
    const buyers = receipt.buyers || [];
    const firstBuyerId = buyers.length > 0 ? buyers[0].id : null;
    const isFirstBuyer = buyerId === firstBuyerId;

    const parsedValue = parseAmount(inputValue);

    if (isFirstBuyer) {
      // Правила для первого покупателя
      if (parsedValue === 0) {
        // Пусто или 0 → восстанавливаем oldValue
        updateDistribution(productId, buyerId, oldValue);
        return;
      }

      if (parsedValue < oldValue) {
        // Уменьшение → восстанавливаем oldValue
        updateDistribution(productId, buyerId, oldValue);
        return;
      }

      // Увеличение → применяем
      updateDistribution(productId, buyerId, parsedValue);
    } else {
      // Правила для не первых покупателей
      if (parsedValue === 0) {
        // Пусто или 0 → всё первому покупателю
        updateDistribution(productId, buyerId, 0);
        return;
      }

      // Увеличение или уменьшение → применяем (излишек уходит первому)
      updateDistribution(productId, buyerId, parsedValue);
    }
  };

  const removeBuyer = (buyerId) => {
    const buyers = receipt.buyers || [];

    if (buyers.length === 0) return;

    const firstBuyerId = buyers[0].id;
    const isRemovingFirst = buyerId === firstBuyerId;

    let updatedBuyers;

    if (isRemovingFirst) {
      // Remove first buyer
      if (buyers.length === 1) {
        // Last buyer, just remove
        updatedBuyers = [];
      } else {
        // Next buyer becomes first
        updatedBuyers = buyers.filter(b => b.id !== buyerId);
        const newFirstBuyerId = updatedBuyers[0].id;

        // Reassign all distributions: old first buyer's share goes to new first buyer
        receipt.products.forEach(product => {
          const currentDist = product.distribution || {};
          const removedShare = currentDist[firstBuyerId] || 0;

          const newDist = {};
          // Copy all distributions except removed buyer
          Object.keys(currentDist).forEach(key => {
            if (key !== buyerId) {
              newDist[key] = currentDist[key];
            }
          });

          // All of removed first buyer's share goes to new first buyer
          const currentNewFirstShare = newDist[newFirstBuyerId] || 0;
          newDist[newFirstBuyerId] = currentNewFirstShare + removedShare;

          updateProductDistribution(receipt.id, product.id, newDist);
        });
      }
    } else {
      // Remove non-first buyer - their share goes to first buyer
      updatedBuyers = buyers.filter(b => b.id !== buyerId);

      receipt.products.forEach(product => {
        const currentDist = product.distribution || {};
        const removedBuyerShare = currentDist[buyerId] || 0;

        const newDist = { ...currentDist };
        delete newDist[buyerId];

        if (removedBuyerShare > 0) {
          newDist[firstBuyerId] = (newDist[firstBuyerId] || 0) + removedBuyerShare;
        }

        updateProductDistribution(receipt.id, product.id, newDist);
      });
    }

    updateBuyers(receipt.id, updatedBuyers);
  };

  return {
    receipt,
    newBuyerName,
    setNewBuyerName,
    savedBuyers,
    showBuyerDropdown,
    setShowBuyerDropdown,
    tempInputValues,
    handleInputChange,
    handleBlur,
    addBuyer,
    selectBuyer,
    removeBuyer,
  };
}
