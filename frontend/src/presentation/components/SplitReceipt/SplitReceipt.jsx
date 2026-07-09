import { useParams, useNavigate } from 'react-router-dom';
import { calculateBuyerShare } from '../../../core/domain/Buyer.js';
import { useReceiptSplit } from '../../hooks/useReceiptSplit.js';

export function SplitReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  if (!receipt) {
    return (
      <div className="min-h-screen bg-forest p-4">
        <div className="max-w-4xl mx-auto">
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

  return (
    <div className="min-h-screen bg-forest p-3">
      <div className="max-w-6xl mx-auto">
        <div className="mb-3 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/receipt/${receipt.id}`)}
              className="text-beige/70 hover:text-beige flex items-center gap-1 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-4 text-beige">Split Receipt</h1>

        <div className="bg-beige rounded-lg p-4 mb-4 shadow-md">
          <h2 className="text-base font-semibold mb-3 text-forest">Buyers</h2>
          <div className="relative">
            <div className="flex gap-2 mb-3">
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
                  className="w-full border border-forest/30 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta bg-white text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addBuyer()}
                  autoComplete="off"
                />
                {showBuyerDropdown && savedBuyers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-beige border border-forest/30 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {savedBuyers
                      .filter(b => b.name.toLowerCase().includes(newBuyerName.toLowerCase()))
                      .map(buyer => (
                        <div
                          key={buyer.id}
                          onClick={() => selectBuyer(buyer)}
                          className="p-2 hover:bg-forest/10 cursor-pointer border-b border-forest/10 last:border-b-0"
                        >
                          <div className="font-medium text-forest text-sm">{buyer.name}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <button
                onClick={addBuyer}
                className="bg-forest hover:bg-forest/90 text-beige font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>
          </div>

          {buyers.length === 0 ? (
            <p className="text-forest/60 text-center py-3 text-sm">
              Add a buyer to start splitting the receipt
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {buyers.map((buyer) => {
                const total = calculateBuyerShare(buyer.id, receipt);
                return (
                  <div key={buyer.id} className="bg-forest/10 p-3 rounded-lg border border-forest/20">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-forest text-sm">
                        {buyer.name}
                      </h3>
                      <button
                        onClick={() => removeBuyer(buyer.id)}
                        className="text-terracotta hover:text-terracotta/80 text-sm font-bold"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-base font-bold text-terracotta">
                      {total.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {buyers.length > 0 && (
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
                                inputMode="decimal"
                                value={inputValue}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => handleInputChange(product.id, buyer.id, e.target.value)}
                                onBlur={(e) => handleBlur(
                                  product.id,
                                  buyer.id,
                                  e.target.value
                                )}
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
        )}
      </div>
    </div>
  );
}
