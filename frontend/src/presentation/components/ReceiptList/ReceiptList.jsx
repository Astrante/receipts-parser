import { useEffect, useState } from 'react';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { useNavigate } from 'react-router-dom';
import { BuyerRepository } from '../../../core/repositories/BuyerRepository.js';
import { calculateBuyerShare } from '../../../core/domain/Buyer.js';

export function ReceiptList() {
  const { receipts, loadReceipts, deleteReceipt } = useReceiptStore();
  const navigate = useNavigate();
  const [defaultUserName, setDefaultUserName] = useState('');

  useEffect(() => {
    loadReceipts();
    const defaultName = localStorage.getItem('defaultUserName') || '';
    setDefaultUserName(defaultName);
  }, [loadReceipts]);

  const getBuyersBreakdown = (receipt) => {
    if (!receipt.buyers || receipt.buyers.length === 0) {
      return null;
    }

    return receipt.buyers.map(buyer => ({
      name: buyer.name,
      share: calculateBuyerShare(buyer.id, receipt)
    }));
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this receipt?')) {
      deleteReceipt(id);
    }
  };

  // Sort receipts: by date descending, then by creation time
  const sortedReceipts = [...receipts].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) {
      return dateB - dateA; // Most recent first
    }
    const createdA = new Date(a.createdAt || 0).getTime();
    const createdB = new Date(b.createdAt || 0).getTime();
    return createdB - createdA;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Receipts</h1>
          <button
            onClick={() => navigate('/scan')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + Scan New
          </button>
        </div>

        {sortedReceipts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg mb-4">No receipts yet</p>
            <button
              onClick={() => navigate('/scan')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Scan Your First Receipt
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReceipts.map((receipt) => {
              const buyersBreakdown = getBuyersBreakdown(receipt);

              return (
                <div
                  key={receipt.id}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow relative"
                >
                  <button
                    onClick={(e) => handleDelete(receipt.id, e)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-xl font-bold leading-none"
                    title="Delete receipt"
                  >
                    ×
                  </button>
                  <div
                    onClick={() => navigate(`/receipt/${receipt.id}`)}
                    className="cursor-pointer pr-8"
                  >
                    <h3 className="font-semibold text-lg text-gray-800">{receipt.storeName}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {new Date(receipt.date).toLocaleDateString('sr-RS', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {receipt.products.length} items
                    </p>
                  </div>
                  <div className="mt-3 flex justify-end items-start">
                    <div className="text-right">
                      <p className="font-bold text-xl text-gray-800">
                        {receipt.totalAmount.toFixed(2)} RSD
                      </p>
                      {buyersBreakdown && (
                        <div className="mt-2 space-y-1">
                          {buyersBreakdown.map((buyer, idx) => (
                            <div key={idx} className="text-sm text-gray-600">
                              {buyer.name}: {buyer.share.toFixed(2)} RSD
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
