import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { decodeReceipt } from '../../../core/utils/receiptShare.js';
import { calculateBuyerShare } from '../../../core/domain/Buyer.js';

export function SharedReceipt() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addReceipt } = useReceiptStore();
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const encodedData = searchParams.get('data');

    if (!encodedData) {
      setError('No receipt data found in URL');
      return;
    }

    try {
      const decodedReceipt = decodeReceipt(encodedData);

      // Генерируем новый ID для импортированного чека
      const importedReceipt = {
        ...decodedReceipt,
        id: crypto.randomUUID(),
        originalUrl: decodedReceipt.originalUrl || null,
        importedAt: new Date().toISOString()
      };

      setReceipt(importedReceipt);
    } catch (err) {
      console.error('Failed to decode receipt:', err);
      setError('Failed to load receipt. The link may be corrupted.');
    }
  }, [searchParams]);

  const handleImportToLocal = () => {
    if (!receipt) return;

    setIsImporting(true);
    try {
      addReceipt(receipt);

      // Переходим на страницу чека
      setTimeout(() => {
        navigate(`/receipt/${receipt.id}`);
      }, 500);
    } catch (err) {
      console.error('Failed to import receipt:', err);
      alert('Failed to import receipt');
      setIsImporting(false);
    }
  };

  const formatDateTime = (date) => {
    const d = new Date(date);
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-forest p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-beige rounded-lg p-6 text-center shadow-xl">
            <h1 className="text-xl font-bold text-terracotta mb-3">Error</h1>
            <p className="text-forest/70 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-terracotta hover:bg-terracotta/90 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Go to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-forest p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-beige rounded-lg p-6 text-center shadow-xl">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-terracotta border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-forest/70 text-sm">Loading receipt...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const buyers = receipt.buyers || [];
  const hasBuyers = buyers.length > 0;

  return (
    <div className="min-h-screen bg-forest p-3">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <div className="bg-beige/90 border border-beige rounded-lg p-3 mb-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-forest mb-1 text-sm">Shared Receipt</h3>
                <p className="text-xs text-forest/80">
                  Import to save permanently
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/')}
              className="text-beige/70 hover:text-beige flex items-center gap-1 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              onClick={handleImportToLocal}
              disabled={isImporting}
              className="bg-terracotta hover:bg-terracotta/90 disabled:bg-forest/30 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center gap-2 text-xs"
            >
              {isImporting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Import
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-beige rounded-lg p-4 mb-3 shadow-md">
          <h1 className="text-xl font-bold mb-1 text-forest">{receipt.storeName}</h1>
          <p className="text-forest/70 text-sm">{formatDateTime(receipt.date)}</p>
        </div>

        {hasBuyers && (
          <div className="bg-beige rounded-lg p-4 mb-3 shadow-md">
            <h2 className="text-base font-semibold mb-2 text-forest">Buyers</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {buyers.map((buyer) => {
                const total = calculateBuyerShare(buyer.id, receipt);
                return (
                  <div key={buyer.id} className="bg-forest/10 p-2 rounded-lg border border-forest/20">
                    <h3 className="font-semibold text-xs text-forest">{buyer.name}</h3>
                    <p className="text-base font-bold text-terracotta">
                      {total.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-beige rounded-lg overflow-hidden mb-3 shadow-md">
          <div className="p-3 bg-forest/10 border-b border-forest/20">
            <h2 className="font-semibold text-forest text-sm">Products ({receipt.products.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {hasBuyers ? (
              <table className="w-full text-sm">
                <thead className="bg-forest/10">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-forest text-xs">Product</th>
                    <th className="px-3 py-2 text-right font-semibold text-forest text-xs">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold text-forest text-xs">Total</th>
                    {buyers.map(buyer => (
                      <th key={buyer.id} className="px-3 py-2 text-center font-semibold text-forest text-xs">
                        {buyer.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/10">
                  {receipt.products.map((product) => {
                    const currentDist = product.distribution || {};
                    return (
                      <tr key={product.id}>
                        <td className="px-3 py-2 font-medium text-forest text-xs">{product.name}</td>
                        <td className="px-3 py-2 text-right text-forest/80 text-xs">
                          {product.quantity} {product.unit}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-forest text-xs">
                          {product.total.toFixed(2)}
                        </td>
                        {buyers.map(buyer => {
                          const share = currentDist[buyer.id] || 0;
                          return (
                            <td key={buyer.id} className="px-3 py-2 text-center">
                              {share > 0 ? (
                                <div className="bg-terracotta/20 text-terracotta py-1 px-2 rounded text-xs">
                                  {share}
                                </div>
                              ) : (
                                <span className="text-forest/40 text-xs">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
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
            )}
          </div>
        </div>

        <div className="bg-beige rounded-lg p-4">
          <div className="flex justify-between items-center text-lg border-t border-forest/20 pt-3 mt-3">
            <span className="font-bold text-forest">Total:</span>
            <span className="font-bold text-terracotta">{receipt.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
