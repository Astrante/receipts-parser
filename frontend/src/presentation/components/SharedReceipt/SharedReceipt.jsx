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
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
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
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading receipt...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const buyers = receipt.buyers || [];
  const hasBuyers = buyers.length > 0;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Shared Receipt</h3>
                <p className="text-sm text-blue-700">
                  This is a shared receipt. To save it permanently, click "Import to My Receipts" below.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/')}
              className="text-blue-500 hover:text-blue-700"
            >
              ← Back to Receipts
            </button>
            <button
              onClick={handleImportToLocal}
              disabled={isImporting}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Import to My Receipts
                </>
              )}
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h1 className="text-2xl font-bold mb-2">{receipt.storeName}</h1>
          <p className="text-gray-500">{formatDateTime(receipt.date)}</p>
        </div>

        {hasBuyers && (
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h2 className="text-lg font-semibold mb-3">Buyers</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {buyers.map((buyer) => {
                const total = calculateBuyerShare(buyer.id, receipt);
                return (
                  <div key={buyer.id} className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="font-semibold text-sm">{buyer.name}</h3>
                    <p className="text-lg font-bold text-blue-600">
                      {total.toFixed(2)} RSD
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-semibold text-lg">Products ({receipt.products.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {hasBuyers ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Product</th>
                    <th className="px-4 py-3 text-right font-semibold">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    {buyers.map(buyer => (
                      <th key={buyer.id} className="px-4 py-3 text-center font-semibold">
                        {buyer.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {receipt.products.map((product) => {
                    const currentDist = product.distribution || {};
                    return (
                      <tr key={product.id}>
                        <td className="px-4 py-3 font-medium">{product.name}</td>
                        <td className="px-4 py-3 text-right">
                          {product.quantity} {product.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {product.total.toFixed(2)}
                        </td>
                        {buyers.map(buyer => {
                          const share = currentDist[buyer.id] || 0;
                          return (
                            <td key={buyer.id} className="px-4 py-3 text-center">
                              {share > 0 ? (
                                <div className="bg-blue-50 text-blue-700 py-1 px-2 rounded">
                                  {share}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
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
              <div className="divide-y">
                {receipt.products.map((product) => (
                  <div key={product.id} className="p-4 flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-500">
                        {product.quantity} {product.unit} × {product.unitPrice.toFixed(2)} RSD
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{product.total.toFixed(2)} RSD</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="flex justify-between items-center text-xl border-t pt-4 mt-4">
            <span className="font-bold">Total:</span>
            <span className="font-bold text-blue-600">{receipt.totalAmount.toFixed(2)} RSD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
