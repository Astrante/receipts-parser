import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { calculateBuyerShare } from '../../../core/domain/Buyer.js';

export function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeReceipt, setActiveReceipt, receipts } = useReceiptStore();
  const [receipt, setReceipt] = useState(null);

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

  const toggleEditing = () => {
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-blue-500 hover:text-blue-700"
            >
              ← Back
            </button>
            {!hasBuyers && !isEditing && (
              <button
                onClick={() => navigate(`/receipt/${receipt.id}/split`)}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-1"
              >
                <span className="text-lg leading-none">+</span>
                <span>Add Buyer</span>
              </button>
            )}
            {hasBuyers && !isEditing && (
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
          <h1 className="text-2xl font-bold mb-2">{receipt.storeName}</h1>
          <p className="text-gray-500">
            {new Date(receipt.date).toLocaleDateString('sr-RS', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Products List with Buyers - when buyers exist */}
        {hasBuyers ? (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
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
                        {buyers.indexOf(buyer) === 0 && (
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
                          return (
                            <td key={buyer.id} className="px-4 py-3 text-center">
                              <div className="text-gray-700">
                                {share > 0 ? share.toFixed(2) : '-'}
                              </div>
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
