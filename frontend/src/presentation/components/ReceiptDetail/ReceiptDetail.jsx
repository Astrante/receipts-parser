import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { calculateBuyerShare, createBuyer } from '../../../core/domain/Buyer.js';
import { BuyerRepository } from '../../../core/repositories/BuyerRepository.js';

export function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeReceipt, setActiveReceipt, receipts, updateStoreName, updateBuyers, updateProductDistribution } = useReceiptStore();
  const [receipt, setReceipt] = useState(null);
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [editedStoreName, setEditedStoreName] = useState('');
  const [newBuyerName, setNewBuyerName] = useState('');
  const [savedBuyers, setSavedBuyers] = useState([]);
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);
  const [isBuyersCollapsed, setIsBuyersCollapsed] = useState(false);

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

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this receipt?')) {
      const { deleteReceipt } = useReceiptStore.getState();
      deleteReceipt(id);
      navigate('/');
    }
  };

  const handleEditStoreName = () => {
    setEditedStoreName(receipt.storeName);
    setIsEditingStore(true);
  };

  const handleSaveStoreName = () => {
    if (editedStoreName.trim()) {
      updateStoreName(receipt.id, editedStoreName.trim());
      setReceipt(prev => ({ ...prev, storeName: editedStoreName.trim() }));
    }
    setIsEditingStore(false);
  };

  const handleCancelStoreName = () => {
    setIsEditingStore(false);
    setEditedStoreName('');
  };

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
      <div className="min-h-screen bg-forest p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-beige rounded-lg p-6 text-center shadow-xl">
            <p className="text-forest/70">Receipt not found</p>
            <button
              onClick={() => navigate('/')}
              className="mt-3 text-terracotta hover:text-terracotta/80 font-medium"
            >
              ← Back to Receipts
            </button>
          </div>
        </div>
      </div>
    );
  }

  const buyers = receipt.buyers || [];
  const hasBuyers = buyers.length > 0;
  const firstBuyerId = buyers.length > 0 ? buyers[0].id : null;

  const formatDateTime = (date) => {
    const d = new Date(date);
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-forest p-3">
      <div className="max-w-7xl mx-auto">
        <div className="mb-3 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-beige/70 hover:text-beige flex items-center gap-1 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            {!hasBuyers && (
              <button
                onClick={() => navigate(`/receipt/${receipt.id}/split`)}
                className="bg-terracotta hover:bg-terracotta/90 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Buyer
              </button>
            )}
            {hasBuyers && (
              <button
                onClick={() => navigate(`/receipt/${receipt.id}/split`)}
                className="bg-forest hover:bg-forest/90 text-beige text-xs font-medium py-2 px-3 rounded-lg transition-colors"
              >
                Edit Split
              </button>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="text-beige/60 hover:text-terracotta text-2xl font-bold leading-none p-1"
            title="Delete receipt"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 space-y-3">
            <div className="bg-beige rounded-lg p-4 shadow-md">
              {isEditingStore ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedStoreName}
                    onChange={(e) => setEditedStoreName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveStoreName()}
                    className="flex-1 text-xl font-bold border border-forest/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-terracotta bg-white text-forest"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveStoreName}
                    className="bg-terracotta hover:bg-terracotta/90 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelStoreName}
                    className="bg-forest/20 hover:bg-forest/30 text-forest font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-forest">{receipt.storeName}</h1>
                  <button
                    onClick={handleEditStoreName}
                    className="text-forest/60 hover:text-terracotta p-1"
                    title="Edit store name"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
              <p className="text-forest/70 text-sm">
                {formatDateTime(receipt.date)}
              </p>
            </div>

            {hasBuyers && (
              <div className="lg:hidden bg-beige rounded-lg p-3 shadow-md">
                <button
                  onClick={() => setIsBuyersCollapsed(!isBuyersCollapsed)}
                  className="w-full flex items-center justify-between font-semibold mb-2 text-forest"
                >
                  <span className="text-sm">Buyers ({buyers.length})</span>
                  <svg className={`w-4 h-4 text-forest/60 transition-transform ${isBuyersCollapsed ? '' : '-rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {!isBuyersCollapsed && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newBuyerName}
                        onChange={(e) => {
                          setNewBuyerName(e.target.value);
                          setShowBuyerDropdown(e.target.value.length > 0);
                        }}
                        onFocus={() => setShowBuyerDropdown(true)}
                        placeholder="Add buyer..."
                        className="flex-1 border border-forest/30 p-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-terracotta bg-white"
                        onKeyDown={(e) => e.key === 'Enter' && addBuyer()}
                        autoComplete="off"
                      />
                      <button
                        onClick={addBuyer}
                        className="bg-terracotta hover:bg-terracotta/90 text-white px-3 py-2 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {buyers.map((buyer) => {
                        const total = calculateBuyerShare(buyer.id, receipt);
                        return (
                          <div key={buyer.id} className="bg-forest/10 p-2 rounded-lg border border-forest/20 relative">
                            <button
                              onClick={() => removeBuyer(buyer.id)}
                              className="absolute top-1 right-1 text-terracotta hover:text-terracotta/80 text-xs"
                            >
                              ×
                            </button>
                            <h3 className="font-semibold text-xs pr-4 text-forest">{buyer.name}</h3>
                            <p className="text-sm font-bold text-terracotta">
                              {total.toFixed(2)} RSD
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

        {hasBuyers ? (
          <div className="bg-beige rounded-lg overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-forest/10">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-forest text-xs">Product</th>
                    <th className="px-3 py-2 text-right font-semibold text-forest text-xs">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold text-forest text-xs">Unit</th>
                    <th className="px-3 py-2 text-right font-semibold text-forest text-xs">Total</th>
                    {buyers.map(buyer => (
                      <th key={buyer.id} className="px-3 py-2 text-center font-semibold text-forest text-xs min-w-[100px]">
                        {buyer.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/10">
                  {receipt.products.map(product => {
                    const unitPrice = product.total / product.quantity;
                    const currentDist = product.distribution || {};

                    return (
                      <tr key={product.id}>
                        <td className="px-3 py-2">
                          <div className="font-medium text-forest text-xs">{product.name}</div>
                        </td>
                        <td className="px-3 py-2 text-right text-forest/80 text-xs">
                          {product.quantity} {product.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-forest/80 text-xs">
                          {unitPrice.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-forest text-xs">
                          {product.total.toFixed(2)}
                        </td>
                        {buyers.map(buyer => {
                          const share = currentDist[buyer.id] || 0;
                          const inputKey = `${product.id}-${buyer.id}`;
                          const inputValue = tempInputValues[inputKey] !== undefined
                            ? tempInputValues[inputKey]
                            : share;

                          return (
                            <td key={buyer.id} className="px-3 py-2 text-center">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={inputValue}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => handleInputChange(product.id, buyer.id, e.target.value)}
                                onBlur={(e) => handleBlur(product.id, buyer.id, e.target.value)}
                                className="w-16 border border-forest/30 p-1.5 rounded text-center focus:outline-none focus:ring-2 focus:ring-terracotta bg-white text-forest text-xs"
                              />
                              <div className="text-xs text-forest/60 mt-0.5">
                                {(share * unitPrice).toFixed(2)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-forest/10 border-t-2 border-forest/20">
                  <tr>
                    <td className="px-3 py-2 text-right font-bold text-forest" colSpan="3">
                      Total:
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-forest">
                      {receipt.totalAmount.toFixed(2)}
                    </td>
                    {buyers.map(buyer => {
                      const total = calculateBuyerShare(buyer.id, receipt);
                      return (
                        <td key={buyer.id} className="px-3 py-2 text-right font-bold text-terracotta">
                          {total.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-beige rounded-lg overflow-hidden mb-3 shadow-md">
            <div className="p-3 bg-forest/10 border-b border-forest/20">
              <h2 className="font-semibold text-forest text-sm">Products ({receipt.products.length})</h2>
            </div>
            <div className="divide-y divide-forest/10">
              {receipt.products.map((product) => (
                <div key={product.id} className="p-3 flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-medium text-forest text-sm">{product.name}</h3>
                    <p className="text-xs text-forest/70">
                      {product.quantity} {product.unit} × {product.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-forest">{product.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

            <div className="bg-beige rounded-lg p-4 shadow-md">
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-forest/70">Subtotal:</span>
                <span className="font-semibold text-forest">{(receipt.totalAmount - receipt.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-forest/70">VAT:</span>
                <span className="font-semibold text-forest">{receipt.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center base border-t border-forest/20 pt-1.5 mt-1.5">
                <span className="font-bold text-forest">Total:</span>
                <span className="font-bold text-terracotta">{receipt.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <button
                onClick={() => window.open(receipt.originalUrl, '_blank')}
                className="w-full bg-forest/10 hover:bg-forest/20 text-forest font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Original
              </button>
            </div>
          </div>

          {hasBuyers && (
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-beige rounded-lg p-3 sticky top-4 shadow-md">
                <h3 className="font-semibold mb-2 text-forest text-sm">Buyers</h3>

                <div className="mb-3">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newBuyerName}
                      onChange={(e) => {
                        setNewBuyerName(e.target.value);
                        setShowBuyerDropdown(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowBuyerDropdown(true)}
                      placeholder="Add buyer..."
                      className="flex-1 border border-forest/30 p-2 rounded text-xs focus:outline-none focus:ring-2 focus:ring-terracotta bg-white"
                      onKeyDown={(e) => e.key === 'Enter' && addBuyer()}
                      autoComplete="off"
                    />
                    <button
                      onClick={addBuyer}
                      className="bg-terracotta hover:bg-terracotta/90 text-white px-3 py-2 rounded text-xs"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  {showBuyerDropdown && savedBuyers.length > 0 && (
                    <div className="relative">
                      <div className="absolute z-10 w-full mt-1 bg-beige border border-forest/30 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {savedBuyers
                          .filter(b => b.name.toLowerCase().includes(newBuyerName.toLowerCase()))
                          .map(buyer => (
                            <div
                              key={buyer.id}
                              onClick={() => selectBuyer(buyer)}
                              className="p-2 hover:bg-forest/10 cursor-pointer border-b border-forest/10 last:border-b-0 text-xs"
                            >
                              <div className="font-medium text-forest">{buyer.name}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {buyers.map((buyer) => {
                    const total = calculateBuyerShare(buyer.id, receipt);
                    return (
                      <div key={buyer.id} className="bg-forest/10 p-3 rounded-lg border border-forest/20 relative group">
                        <button
                          onClick={() => removeBuyer(buyer.id)}
                          className="absolute top-2 right-2 text-terracotta hover:text-terracotta/80 text-xs opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                        <h3 className="font-semibold text-xs pr-4 text-forest">{buyer.name}</h3>
                        <p className="text-base font-bold text-terracotta">
                          {total.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
