import { useState } from 'react';
import { BottomSheet } from '../shared/BottomSheet.jsx';
import { ReceiptParserService } from '../../../core/services/ReceiptParser.js';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { useNavigate } from 'react-router-dom';

export function AddByLinkBottomSheet({ isOpen, onClose }) {
  const [storeName, setStoreName] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { addReceipt, clearError } = useReceiptStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;

    clearError();
    setError(null);
    setIsParsing(true);

    try {
      const parser = new ReceiptParserService();
      const receipt = await parser.parseFromUrl(manualUrl, storeName.trim() || null);
      addReceipt(receipt);
      setManualUrl('');
      setStoreName('');
      onClose();
      navigate(`/receipt/${receipt.id}`);
    } catch (err) {
      console.error('Parse error:', err);
      setError(getUserFriendlyError(err.message));
    } finally {
      setIsParsing(false);
    }
  };

  const getUserFriendlyError = (errorMessage) => {
    if (errorMessage.includes('Failed to parse receipt') || errorMessage.includes('Invalid receipt URL')) {
      return 'Не удалось прочитать чек. Убедитесь, что ссылка правильная.';
    }
    if (errorMessage.includes('Invalid receipt data format')) {
      return 'Чек имеет неправильный формат.';
    }
    if (errorMessage.includes('Failed to fetch receipt')) {
      return 'Не удалось получить данные чека с сервера.';
    }
    return errorMessage || 'Произошла ошибка. Попробуйте снова.';
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 className="text-lg font-semibold text-slate">Add by Link</h2>

        {isParsing && (
          <div className="p-3 bg-forest/10 rounded-lg">
            <div className="flex items-center mb-2">
              <svg className="animate-spin h-4 w-4 text-forest mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-forest text-sm font-medium">Processing...</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate mb-1">Store name (optional)</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Maxi, Idea, Shop..."
            className="w-full border border-slate/30 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest bg-white"
            disabled={isParsing}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate mb-1">Receipt URL</label>
          <div className="relative">
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://suf.purs.gov.rs/v/..."
              className="w-full border border-slate/30 p-2 pl-9 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest bg-white"
              disabled={isParsing}
              required
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        </div>

        <button
          type="submit"
          disabled={isParsing || !manualUrl.trim()}
          className="w-full bg-forest hover:bg-forest/80 disabled:bg-slate/30 text-beige font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        )}
      </form>
    </BottomSheet>
  );
}
