import { useEffect, useState } from 'react';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { useNavigate } from 'react-router-dom';
import { BuyerRepository } from '../../../core/repositories/BuyerRepository.js';
import { calculateBuyerShare } from '../../../core/domain/Buyer.js';

export function ReceiptList() {
  const { receipts, loadReceipts } = useReceiptStore();
  const navigate = useNavigate();
  const [defaultUserName, setDefaultUserName] = useState('');

  useEffect(() => {
    loadReceipts();
    // Load default user name
    const defaultName = localStorage.getItem('defaultUserName') || '';
    setDefaultUserName(defaultName);
  }, [loadReceipts]);

  const getUserShare = (receipt) => {
    if (!receipt.buyers || receipt.buyers.length === 0) {
      return receipt.totalAmount;
    }

    // If there's only one buyer (default user), show their share
    if (receipt.buyers.length === 1) {
      const buyer = receipt.buyers[0];
      return calculateBuyerShare(buyer.id, receipt);
    }

    // If there are multiple buyers, show split info
    const totalBuyers = receipt.buyers.length;
    return `${receipt.totalAmount.toFixed(2)} RSD (${totalBuyers} people)`;
  };

  const getShareDisplay = (receipt) => {
    if (!receipt.buyers || receipt.buyers.length === 0) {
      return receipt.totalAmount.toFixed(2);
    }

    // Find default buyer
    const defaultBuyer = receipt.buyers.find(b => b.name === defaultUserName);
    if (defaultBuyer) {
      return calculateBuyerShare(defaultBuyer.id, receipt).toFixed(2);
    }

    // If first buyer exists
    if (receipt.buyers[0]) {
      return calculateBuyerShare(receipt.buyers[0].id, receipt).toFixed(2);
    }

    return receipt.totalAmount.toFixed(2);
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
            + Scan New
          </button>
        </div>

        {receipts.length === 0 ? (
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
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                onClick={() => navigate(`/receipt/${receipt.id}`)}
                className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800">{receipt.storeName}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {new Date(receipt.date).toLocaleDateString('sr-RS', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {receipt.products.length} items
                    </p>
                    {receipt.buyers && receipt.buyers.length > 0 && (
                      <p className="text-sm text-blue-600 mt-1">
                        {receipt.buyers.length === 1
                          ? `Your share: ${getShareDisplay(receipt)} RSD`
                          : `Split between ${receipt.buyers.length} people`
                        }
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-gray-800">
                      {getShareDisplay(receipt)} RSD
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {receipt.buyers && receipt.buyers.length > 1 ? 'your share' : 'total'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
