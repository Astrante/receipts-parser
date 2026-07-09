import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { calculateBuyerShare } from '../../../core/domain/Buyer.js';
import { formatDateTime } from '../../../core/utils/format.js';
import { useReceiptSplit } from '../../hooks/useReceiptSplit.js';

export function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateStoreName, deleteReceipt } = useReceiptStore();
  const {
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
  } = useReceiptSplit(id);

  const [isEditingStore, setIsEditingStore] = useState(false);
  const [editedStoreName, setEditedStoreName] = useState('');
  const [isBuyersCollapsed, setIsBuyersCollapsed] = useState(true);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this receipt?')) {
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
    }
    setIsEditingStore(false);
  };

  const handleCancelStoreName = () => {
    setIsEditingStore(false);
    setEditedStoreName('');
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

  return (
    <div className="min-h-screen bg-forest p-3">
      <div className="max-w-7xl mx-auto">
        <div className="mb-3 flex justify-between items-start">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="text-beige/70 hover:text-beige flex items-center gap-1 font-medium"
              style={{ fontSize: '13px' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            {!hasBuyers && (
              <button
                onClick={() => navigate(`/receipt/${receipt.id}/split`)}
                className="bg-terracotta hover:bg-terracotta/90 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center gap-1"
                style={{ fontSize: '12px' }}
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
                className="bg-forest hover:bg-forest/90 text-beige font-medium py-2 px-3 rounded-lg transition-colors"
                style={{ fontSize: '12px' }}
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
            <div className="bg-beige rounded-lg p-3 shadow-md">
              {isEditingStore ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedStoreName}
                    onChange={(e) => setEditedStoreName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveStoreName()}
                    className="flex-1 font-semibold border border-forest/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-terracotta bg-charcoal text-beige"
                    style={{ fontSize: '15px' }}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveStoreName}
                    className="bg-terracotta hover:bg-terracotta/90 text-white font-medium py-2 px-3 rounded-lg transition-colors"
                    style={{ fontSize: '12px' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelStoreName}
                    className="bg-forest/20 hover:bg-forest/30 text-forest font-medium py-2 px-3 rounded-lg transition-colors"
                    style={{ fontSize: '12px' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h1 className="font-semibold text-forest flex-1" style={{ fontSize: '15px', marginBottom: '4px' }}>{receipt.storeName}</h1>
                  <button
                    onClick={handleEditStoreName}
                    className="text-forest/60 hover:text-terracotta p-1"
                    title="Edit store name"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="flex gap-3" style={{ fontSize: '13px', color: '#4A4A4A' }}>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'rgba(74, 74, 74, 0.5)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDateTime(receipt.date)}
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'rgba(74, 74, 74, 0.5)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {receipt.products.length} items
                </div>
              </div>
            </div>

            {hasBuyers && (
              <div className="lg:hidden bg-beige rounded-lg p-3 shadow-md">
                <button
                  onClick={() => setIsBuyersCollapsed(!isBuyersCollapsed)}
                  className="w-full flex items-center justify-between font-semibold mb-2 text-forest"
                >
                  <span style={{ fontSize: '13px' }}>Buyers ({buyers.length})</span>
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
                        className="flex-1 border border-forest/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta bg-charcoal text-beige placeholder-beige/50"
                        style={{ fontSize: '12px' }}
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
                    <div className="flex flex-wrap gap-2">
                      {buyers.map((buyer) => {
                        const total = calculateBuyerShare(buyer.id, receipt);
                        return (
                          <div key={buyer.id} className="bg-forest/10 p-2 rounded-lg border border-forest/20 relative flex-1 min-w-[140px]">
                            <button
                              onClick={() => removeBuyer(buyer.id)}
                              className="absolute top-1 right-1 text-terracotta hover:text-terracotta/80"
                              style={{ fontSize: '16px', lineHeight: '1' }}
                            >
                              ×
                            </button>
                            <h3 className="font-semibold pr-4 text-forest" style={{ fontSize: '12px' }}>{buyer.name}</h3>
                            <p className="font-semibold text-terracotta" style={{ fontSize: '13px' }}>
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
          <div className="space-y-2">
            {receipt.products.map(product => {
              const unitPrice = product.total / product.quantity;
              const currentDist = product.distribution || {};

              return (
                <div key={product.id} className="bg-beige rounded-lg shadow-md mx-auto" style={{ maxWidth: '500px' }}>
                  <div className="flex gap-2 p-2">
                    <div className="flex flex-col justify-center flex-shrink-0">
                      <h3 className="font-medium text-forest mb-1" style={{ fontSize: '11px' }}>{product.name}</h3>
                      <div style={{ fontSize: '11px', color: '#4A4A4A' }}>{product.quantity} × {unitPrice.toFixed(2)}</div>
                      <div className="font-semibold text-forest" style={{ fontSize: '11px' }}>{product.total.toFixed(2)}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-auto">
                      {buyers.map(buyer => {
                        const share = currentDist[buyer.id] || 0;
                        const inputKey = `${product.id}-${buyer.id}`;
                        const inputValue = tempInputValues[inputKey] !== undefined
                          ? tempInputValues[inputKey]
                          : share;

                        return (
                          <div key={buyer.id} className="bg-forest/5 rounded px-1.5 py-0.5">
                            <div className="text-xs text-forest/70 mb-0 text-center" style={{ fontSize: '10px' }}>{buyer.name}</div>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={inputValue}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleInputChange(product.id, buyer.id, e.target.value)}
                              onBlur={(e) => handleBlur(product.id, buyer.id, e.target.value)}
                              className="w-[35px] border border-charcoal px-0.5 py-0.5 rounded text-center focus:outline-none focus:ring-2 focus:ring-terracotta bg-darkSlate text-beige"
                              style={{ fontSize: '11px' }}
                            />
                            <div className="text-right mt-1" style={{ fontSize: '10px', color: '#4A4A4A' }}>
                              {(share * unitPrice).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="bg-beige rounded-lg p-2 shadow-md mx-auto" style={{ maxWidth: '500px' }}>
              <div className="flex gap-2 bg-forest/10 -mx-2 px-2 py-2 rounded-lg">
                <div className="flex flex-col justify-center font-semibold text-forest flex-shrink-0" style={{ fontSize: '11px' }}>
                  Total
                </div>
                <div className="flex flex-wrap gap-2 ml-auto">
                  {buyers.map(buyer => {
                    const total = calculateBuyerShare(buyer.id, receipt);
                    return (
                      <div key={buyer.id} className="flex flex-col justify-center">
                        <div className="font-semibold text-terracotta text-center" style={{ fontSize: '11px' }}>
                          {total.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {receipt.products.map((product) => (
              <div key={product.id} className="bg-beige rounded-lg p-3 shadow-md flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="font-medium text-forest" style={{ fontSize: '12px' }}>{product.name}</h3>
                  <p style={{ fontSize: '11px', color: '#4A4A4A' }}>
                    {product.quantity} {product.unit} × {product.unitPrice.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-forest" style={{ fontSize: '12px' }}>{product.total.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

            <div className="bg-beige rounded-lg p-3 shadow-md">
              <div className="flex justify-between items-center mb-1.5" style={{ fontSize: '13px' }}>
                <span style={{ color: '#4A4A4A' }}>Subtotal:</span>
                <span className="font-semibold text-forest">{(receipt.totalAmount - receipt.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-1.5" style={{ fontSize: '13px' }}>
                <span style={{ color: '#4A4A4A' }}>VAT:</span>
                <span className="font-semibold text-forest">{receipt.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-forest/20 pt-1.5 mt-1.5" style={{ fontSize: '13px' }}>
                <span className="font-bold text-forest">Total:</span>
                <span className="font-bold text-terracotta">{receipt.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <button
                onClick={() => window.open(receipt.originalUrl, '_blank')}
                className="w-full bg-forest/10 hover:bg-forest/20 text-forest font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                style={{ fontSize: '13px' }}
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
                <button
                  onClick={() => setIsBuyersCollapsed(!isBuyersCollapsed)}
                  className="w-full flex items-center justify-between font-semibold mb-2 text-forest"
                >
                  <span style={{ fontSize: '13px' }}>Buyers ({buyers.length})</span>
                  <svg className={`w-4 h-4 text-forest/60 transition-transform ${isBuyersCollapsed ? '' : '-rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {!isBuyersCollapsed && (
                  <>
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
                      className="flex-1 border border-forest/30 p-2 rounded focus:outline-none focus:ring-2 focus:ring-terracotta bg-charcoal text-beige placeholder-beige/50"
                      style={{ fontSize: '12px' }}
                      onKeyDown={(e) => e.key === 'Enter' && addBuyer()}
                      autoComplete="off"
                    />
                    <button
                      onClick={addBuyer}
                      className="bg-terracotta hover:bg-terracotta/90 text-white px-3 py-2 rounded"
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
                              className="p-2 hover:bg-forest/10 cursor-pointer border-b border-forest/10 last:border-b-0"
                              style={{ fontSize: '12px' }}
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
                      <div key={buyer.id} className="bg-forest/10 p-2.5 rounded-lg border border-forest/20 relative group">
                        <button
                          onClick={() => removeBuyer(buyer.id)}
                          className="absolute top-2 right-2 text-terracotta hover:text-terracotta/80 opacity-0 group-hover:opacity-100"
                          style={{ fontSize: '16px', lineHeight: '1' }}
                        >
                          ×
                        </button>
                        <h3 className="font-semibold pr-4 text-forest" style={{ fontSize: '12px' }}>{buyer.name}</h3>
                        <p className="font-semibold text-terracotta" style={{ fontSize: '14px' }}>
                          {total.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
