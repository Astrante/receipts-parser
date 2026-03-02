import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { createBuyer, calculateBuyerShare } from '../../../core/domain/Buyer.js';
import { BuyerRepository } from '../../../core/repositories/BuyerRepository.js';

export function SplitReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeReceipt, setActiveReceipt, updateBuyers, updateProductDistribution, receipts } = useReceiptStore();
  const [receipt, setReceipt] = useState(null);
  const [newBuyerName, setNewBuyerName] = useState('');
  const [savedBuyers, setSavedBuyers] = useState([]);
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);

  // Временные значения для input полей (чтобы можно было вводить)
  const [tempInputValues, setTempInputValues] = useState({});

  useEffect(() => {
    const buyers = BuyerRepository.findAll();
    setSavedBuyers(buyers);
  }, []);

  useEffect(() => {
    if (!activeReceipt || activeReceipt.id !== id) {
      const found = receipts.find(r => r.id === id);
      if (found) {
        setReceipt(found);
        setActiveReceipt(id);
      }
    } else {
      setReceipt(activeReceipt);
    }
  }, [id, activeReceipt, receipts, setActiveReceipt]);

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

      const updatedReceipt = {
        ...receipt,
        buyers: updatedBuyers,
        products: updatedProducts
      };

      updateBuyers(receipt.id, updatedBuyers);
      updatedProducts.forEach(product => {
        updateProductDistribution(receipt.id, product.id, product.distribution);
      });

      setReceipt(updatedReceipt);
    } else {
      const updatedReceipt = {
        ...receipt,
        buyers: updatedBuyers
      };

      updateBuyers(receipt.id, updatedBuyers);
      setReceipt(updatedReceipt);
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

    const parsedValue = newValue === '' ? 0 : parseFloat(newValue);
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

    updateProductDistribution(receipt.id, productId, newDistribution);

    setReceipt(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.id === productId ? { ...p, distribution: newDistribution } : p
      )
    }));
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

    const parsedValue = inputValue === '' || inputValue === '0' ? 0 : parseFloat(inputValue);

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
    setReceipt(prev => ({ ...prev, buyers: updatedBuyers }));
  };

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Receipt not found</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 text-blue-500 hover:text-blue-700"
            >
              Back to Receipts
            </button>
          </div>
        </div>
      </div>
    );
  }

  const buyers = receipt.buyers || [];
  const firstBuyerId = buyers.length > 0 ? buyers[0].id : null;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/receipt/${receipt.id}`)}
              className="text-blue-500 hover:text-blue-700"
            >
              ← Back
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-6">Split Receipt</h1>

        {/* Add Buyers */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Buyers</h2>
          <div className="relative">
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newBuyerName}
                  onChange={(e) => {
                    setNewBuyerName(e.target.value);
                    setShowBuyerDropdown(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowBuyerDropdown(true)}
                  placeholder="Buyer name or select from list"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addBuyer()}
                  autoComplete="off"
                />
                {showBuyerDropdown && savedBuyers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {savedBuyers
                      .filter(b => b.name.toLowerCase().includes(newBuyerName.toLowerCase()))
                      .map(buyer => (
                        <div
                          key={buyer.id}
                          onClick={() => selectBuyer(buyer)}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium">{buyer.name}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <button
                onClick={addBuyer}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-1"
              >
                <span className="text-lg leading-none">+</span>
                <span>Add Buyer</span>
              </button>
            </div>
          </div>

          {buyers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Add a buyer to start splitting the receipt
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {buyers.map((buyer) => {
                const total = calculateBuyerShare(buyer.id, receipt);
                return (
                  <div key={buyer.id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">
                        {buyer.name}
                      </h3>
                      <button
                        onClick={() => removeBuyer(buyer.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-bold"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      {total.toFixed(2)} RSD
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Distribution Table */}
        {buyers.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Product</th>
                    <th className="px-4 py-3 text-right font-semibold">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    {buyers.map(buyer => (
                      <th key={buyer.id} className="px-4 py-3 text-center font-semibold min-w-[120px]">
                        {buyer.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {receipt.products.map(product => {
                    const unitPrice = product.total / product.quantity;
                    const currentDist = product.distribution || {};

                    return (
                      <tr key={product.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{product.name}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {product.quantity} {product.unit}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {unitPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {product.total.toFixed(2)}
                        </td>
                        {buyers.map(buyer => {
                          const share = currentDist[buyer.id] || 0;
                          const inputKey = `${product.id}-${buyer.id}`;
                          const inputValue = tempInputValues[inputKey] !== undefined
                            ? tempInputValues[inputKey]
                            : share;

                          return (
                            <td key={buyer.id} className="px-4 py-3 text-center">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={inputValue}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => handleInputChange(product.id, buyer.id, e.target.value)}
                                onBlur={(e) => handleBlur(
                                  product.id,
                                  buyer.id,
                                  e.target.value
                                )}
                                className="w-20 border border-gray-300 p-2 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                {(share * unitPrice).toFixed(2)} RSD
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2">
                  <tr>
                    <td className="px-4 py-3 text-right font-bold text-lg" colSpan="3">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-lg">
                      {receipt.totalAmount.toFixed(2)} RSD
                    </td>
                    {buyers.map(buyer => {
                      const total = calculateBuyerShare(buyer.id, receipt);
                      return (
                        <td key={buyer.id} className="px-4 py-3 text-right font-bold text-lg text-blue-600">
                          {total.toFixed(2)} RSD
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
