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

    const firstBuyerId = buyers[0].id;
    const isFirstBuyer = buyerId === firstBuyerId;

    const parsedValue = newValue === '' ? 0 : parseFloat(newValue);
    const oldValue = currentDist[buyerId] || 0;

    let newDistribution = { ...currentDist };
    newDistribution[buyerId] = parsedValue;

    if (isFirstBuyer) {
      if (parsedValue < oldValue) {
        newDistribution[buyerId] = oldValue;
      } else {
        const totalOthers = buyers
          .filter(b => b.id !== firstBuyerId)
          .reduce((sum, b) => sum + (newDistribution[b.id] || 0), 0);

        const maxAllowed = product.quantity - totalOthers;
        if (parsedValue > maxAllowed) {
          newDistribution[buyerId] = maxAllowed;
        }
      }
    } else {
      const difference = parsedValue - oldValue;
      const firstBuyerCurrentValue = currentDist[firstBuyerId] || 0;

      if (difference > 0) {
        const canTake = Math.min(firstBuyerCurrentValue, difference);
        newDistribution[firstBuyerId] = firstBuyerCurrentValue - canTake;

        if (canTake < difference) {
          newDistribution[buyerId] = oldValue + canTake;
        }
      } else {
        const excess = Math.abs(difference);
        const firstBuyerNewValue = firstBuyerCurrentValue + excess;
        const maxFirst = product.quantity - buyers
          .filter(b => b.id !== firstBuyerId && b.id !== buyerId)
          .reduce((sum, b) => sum + (newDistribution[b.id] || 0), 0);

        newDistribution[firstBuyerId] = Math.min(firstBuyerNewValue, maxFirst);
      }
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
    if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
      updateDistribution(productId, buyerId, value);
    }
  };

  const getInputValue = (productId, buyerId, actualValue) => {
    return actualValue === 0 ? '' : actualValue;
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
        <div className="max-w-2xl mx-auto">
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
  const hasBuyers = buyers.length > 0;
  const firstBuyerId = buyers.length > 0 ? buyers[0].id : null;

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-blue-500 hover:text-blue-700"
            >
              ← Back
            </button>
            {!hasBuyers && (
              <button
                onClick={() => navigate(`/receipt/${receipt.id}/split`)}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-1"
              >
                <span className="text-lg leading-none">+</span>
                <span>Add Buyer</span>
              </button>
            )}
            {hasBuyers && (
              <button
                onClick={() => navigate(`/receipt/${receipt.id}/split`)}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Edit Split
              </button>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 text-3xl font-bold leading-none"
            title="Delete receipt"
          >
            ×
          </button>
        </div>

        {/* Receipt Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          {isEditingStore ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedStoreName}
                onChange={(e) => setEditedStoreName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveStoreName()}
                className="flex-1 text-2xl font-bold border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleSaveStoreName}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancelStoreName}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold mb-2">{receipt.storeName}</h1>
              <button
                onClick={handleEditStoreName}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                title="Edit store name"
              >
                ✏️
              </button>
            </div>
          )}
          <p className="text-gray-500">
            {formatDateTime(receipt.date)}
          </p>
        </div>

        {/* Add Buyers - always show when has buyers */}
        {hasBuyers && (
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
          </div>
        )}

        {/* Product Distribution Table */}
        {hasBuyers ? (
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
                          const inputValue = getInputValue(product.id, buyer.id, share);
                          const isFirstBuyerColumn = buyer.id === firstBuyerId;

                          return (
                            <td key={buyer.id} className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max={isFirstBuyerColumn ? product.quantity : product.quantity}
                                step="0.01"
                                value={inputValue}
                                onChange={(e) => handleInputChange(
                                  product.id,
                                  buyer.id,
                                  e.target.value
                                )}
                                onFocus={(e) => e.target.select()}
                                placeholder="0"
                                className={`w-20 border p-2 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  isFirstBuyerColumn
                                    ? 'border-blue-300 bg-blue-50'
                                    : 'border-gray-300'
                                }`}
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
        ) : (
          /* Products List - simple view when no buyers */
          <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="font-semibold text-lg">Products ({receipt.products.length})</h2>
            </div>
            <div className="divide-y">
              {receipt.products.map((product) => (
                <div key={product.id} className="p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-500">
                      {product.quantity} {product.unit} × {product.unitPrice.toFixed(2)} RSD
                    </p>
                    {product.taxRate > 0 && (
                      <span className="text-xs text-gray-400">
                        VAT: {product.taxRate}%
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{product.total.toFixed(2)} RSD</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="flex justify-between items-center text-lg mb-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">{(receipt.totalAmount - receipt.taxAmount).toFixed(2)} RSD</span>
          </div>
          <div className="flex justify-between items-center text-lg mb-2">
            <span className="text-gray-600">VAT:</span>
            <span className="font-semibold">{receipt.taxAmount.toFixed(2)} RSD</span>
          </div>
          <div className="flex justify-between items-center text-xl border-t pt-2 mt-2">
            <span className="font-bold">Total:</span>
            <span className="font-bold text-blue-600">{receipt.totalAmount.toFixed(2)} RSD</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => window.open(receipt.originalUrl, '_blank')}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            View Original Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
