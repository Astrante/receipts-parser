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

  useEffect(() => {
    const buyers = BuyerRepository.findAll();
    setSavedBuyers(buyers);
    const defaultUserName = localStorage.getItem('defaultUserName') || '';
    setNewBuyerName(defaultUserName);
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

    if (currentBuyers.length === 0) {
      localStorage.setItem('defaultUserName', newBuyerName.trim());
    }

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

    if (buyers.length > 0 && buyers[0].id === buyerId) {
      alert('Cannot remove the first buyer');
      return;
    }

    const updatedBuyers = buyers.filter(b => b.id !== buyerId);
    updateBuyers(receipt.id, updatedBuyers);

    receipt.products.forEach(product => {
      const currentDist = product.distribution || {};
      const firstBuyerId = buyers[0].id;
      const removedBuyerShare = currentDist[buyerId] || 0;

      const newDist = { ...currentDist };
      delete newDist[buyerId];

      if (removedBuyerShare > 0) {
        newDist[firstBuyerId] = (newDist[firstBuyerId] || 0) + removedBuyerShare;
      }

      updateProductDistribution(receipt.id, product.id, newDist);
    });

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
                  placeholder={buyers.length === 0 ? "Your name (default buyer)" : "Buyer name or select from list"}
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
              Add your name to start splitting the receipt
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {buyers.map((buyer, index) => {
                const total = calculateBuyerShare(buyer.id, receipt);
                const isDefaultBuyer = index === 0;
                return (
                  <div key={buyer.id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">
                        {buyer.name}
                        {isDefaultBuyer && (
                          <span className="ml-2 text-xs text-blue-600 font-normal">(default)</span>
                        )}
                      </h3>
                      {!isDefaultBuyer && (
                        <button
                          onClick={() => removeBuyer(buyer.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-bold"
                        >
                          ×
                        </button>
                      )}
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
                        {buyer.id === firstBuyerId && (
                          <div className="text-xs text-gray-500 font-normal">(buffer)</div>
                        )}
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
        )}
      </div>
    </div>
  );
}
