import { useEffect } from 'react';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { useNavigate } from 'react-router-dom';
import { calculateBuyerShare } from '../../../core/domain/Buyer.js';
import { exportReceiptToJSON } from '../../../core/utils/receiptShare.js';

export function ReceiptList() {
  const { receipts, loadReceipts, deleteReceipt } = useReceiptStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadReceipts();
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

  const handleExport = (receipt, e) => {
    e.stopPropagation();
    try {
      exportReceiptToJSON(receipt);
    } catch (error) {
      console.error('Failed to export receipt:', error);
      alert('Failed to export receipt');
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

  const formatDateTime = (date) => {
    const d = new Date(date);
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Receipts</h1>
          <button
            onClick={() => navigate('/scan')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + New
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
              Add Your First Receipt
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReceipts.map((receipt) => {
              const buyersBreakdown = getBuyersBreakdown(receipt);

              return (
                <div
                  key={receipt.id}
                  onClick={() => navigate(`/receipt/${receipt.id}`)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <div className="p-4">
                    {/* Header: Store name + Actions buttons */}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg text-gray-800 flex-1">{receipt.storeName}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleExport(receipt, e)}
                          className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 text-base leading-none p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Скачать JSON"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDelete(receipt.id, e)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 text-base leading-none p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Удалить чек"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-3"></div>

                    {/* Two column layout */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left column: Date and Items count */}
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDateTime(receipt.date)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {receipt.products.length} items
                        </div>
                      </div>

                      {/* Right column: Buyer breakdown or Total */}
                      <div className="text-right">
                        {buyersBreakdown && buyersBreakdown.length > 0 ? (
                          <div className="space-y-1">
                            {buyersBreakdown.map((buyer, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="text-gray-600">{buyer.name}:</span>{' '}
                                <span className="font-semibold text-gray-800">{buyer.share.toFixed(2)} RSD</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="font-bold text-xl text-gray-800">
                            {receipt.totalAmount.toFixed(2)} RSD
                          </div>
                        )}
                      </div>
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
