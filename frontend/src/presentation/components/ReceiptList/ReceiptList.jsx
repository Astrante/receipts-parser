import { useEffect, useRef, useState } from 'react';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { useNavigate } from 'react-router-dom';
import { calculateBuyerShare } from '../../../core/domain/Buyer.js';
import { importReceiptFromJSON } from '../../../core/utils/receiptShare.js';

export function ReceiptList() {
  const { receipts, loadReceipts, deleteReceipt, addReceipt } = useReceiptStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [showNewMenu, setShowNewMenu] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNewMenu && !event.target.closest('.relative')) {
        setShowNewMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNewMenu]);

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedReceipt = await importReceiptFromJSON(file);

      // Генерируем новый ID для импортированного чека
      const newReceipt = {
        ...importedReceipt,
        id: crypto.randomUUID(),
        importedAt: new Date().toISOString()
      };

      addReceipt(newReceipt);
      alert('Receipt imported successfully!');

      // Перейти к импортированному чеку
      navigate(`/receipt/${newReceipt.id}`);
    } catch (error) {
      console.error('Failed to import receipt:', error);
      alert('Failed to import receipt. Please check the file format.');
    }

    // Очистить input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              + New
            </button>

            {showNewMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    navigate('/scan');
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <div>
                    <div className="font-semibold">Scan Receipt</div>
                    <div className="text-xs text-gray-500">Scan QR code</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowNewMenu(false);
                    handleImportClick();
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-t"
                >
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <div>
                    <div className="font-semibold">Import JSON</div>
                    <div className="text-xs text-gray-500">From file</div>
                  </div>
                </button>
              </div>
            )}
          </div>
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
                    {/* Header: Store name + Delete button */}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg text-gray-800 flex-1">{receipt.storeName}</h3>
                      <button
                        onClick={(e) => handleDelete(receipt.id, e)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 text-base leading-none p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Удалить чек"
                      >
                        ✕
                      </button>
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
