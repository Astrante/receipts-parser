import { useEffect, useState } from 'react';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { useNavigate } from 'react-router-dom';
import { calculateBuyerShare } from '../../../core/domain/Buyer.js';
import { exportReceiptToJSON } from '../../../core/utils/receiptShare.js';
import { DropdownMenu } from '../shared/DropdownMenu.jsx';
import { ScanBottomSheet } from '../ScanBottomSheet/ScanBottomSheet.jsx';
import { AddByLinkBottomSheet } from '../AddByLinkBottomSheet/AddByLinkBottomSheet.jsx';
import { ImportBottomSheet } from '../ImportBottomSheet/ImportBottomSheet.jsx';

export function ReceiptList() {
  const { receipts, loadReceipts, deleteReceipt } = useReceiptStore();
  const navigate = useNavigate();
  const [scanSheetOpen, setScanSheetOpen] = useState(false);
  const [linkSheetOpen, setLinkSheetOpen] = useState(false);
  const [importSheetOpen, setImportSheetOpen] = useState(false);

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

  const dropdownTrigger = (
    <button className="bg-beige hover:bg-beige/90 text-forest font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-lg">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      New
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  const dropdownItems = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Scan',
      onClick: () => setScanSheetOpen(true)
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      label: 'Add by link',
      onClick: () => setLinkSheetOpen(true)
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      label: 'Import',
      onClick: () => setImportSheetOpen(true)
    }
  ];

  return (
    <div className="min-h-screen bg-forest p-3">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-beige">My Receipts</h1>
          <DropdownMenu trigger={dropdownTrigger} items={dropdownItems} />
        </div>

        {sortedReceipts.length === 0 ? (
          <div className="bg-beige rounded-lg p-8 text-center shadow-lg">
            <svg className="mx-auto h-16 w-16 text-forest/60 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-forest/70 mb-4">No receipts yet</p>
            <button
              onClick={() => setScanSheetOpen(true)}
              className="bg-terracotta hover:bg-terracotta/90 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
                  className="bg-beige rounded-lg hover:shadow-xl transition-all cursor-pointer group shadow-md"
                >
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-forest flex-1">{receipt.storeName}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => handleExport(receipt, e)}
                          className="text-forest/60 hover:text-terracotta hover:bg-forest/10 p-1.5 rounded transition-all opacity-0 group-hover:opacity-100"
                          title="Download JSON"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDelete(receipt.id, e)}
                          className="text-forest/60 hover:text-terracotta hover:bg-forest/10 p-1.5 rounded transition-all opacity-0 group-hover:opacity-100"
                          title="Delete receipt"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center text-xs text-forest/70">
                          <svg className="w-3.5 h-3.5 mr-1.5 text-forest/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDateTime(receipt.date)}
                        </div>
                        <div className="flex items-center text-xs text-forest/70">
                          <svg className="w-3.5 h-3.5 mr-1.5 text-forest/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          {receipt.products.length}
                        </div>
                      </div>

                      <div className="text-right">
                        {buyersBreakdown && buyersBreakdown.length > 0 ? (
                          <div className="space-y-0.5">
                            {buyersBreakdown.map((buyer, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="text-forest/70">{buyer.name}:</span>{' '}
                                <span className="font-semibold text-forest">{buyer.share.toFixed(2)} RSD</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="font-bold text-lg text-forest">
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

        <ScanBottomSheet isOpen={scanSheetOpen} onClose={() => setScanSheetOpen(false)} />
        <AddByLinkBottomSheet isOpen={linkSheetOpen} onClose={() => setLinkSheetOpen(false)} />
        <ImportBottomSheet isOpen={importSheetOpen} onClose={() => setImportSheetOpen(false)} />
      </div>
    </div>
  );
}
