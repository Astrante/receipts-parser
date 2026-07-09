import { useState } from 'react';
import { BottomSheet } from '../shared/BottomSheet.jsx';
import { Spinner } from '../shared/Spinner.jsx';
import { useNavigate } from 'react-router-dom';
import { useAddReceipt } from '../../hooks/useAddReceipt.js';

export function AddByLinkBottomSheet({ isOpen, onClose }) {
  const [storeName, setStoreName] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const navigate = useNavigate();
  const { isProcessing, error, addFromUrl } = useAddReceipt();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;

    try {
      const receipt = await addFromUrl(manualUrl, storeName.trim() || null);
      setManualUrl('');
      setStoreName('');
      onClose();
      navigate(`/receipt/${receipt.id}`);
    } catch {
      // Ошибка уже выставлена в error из useAddReceipt.
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 className="text-lg font-semibold text-forest">Add by Link</h2>

        {isProcessing && <Spinner />}

        <div>
          <label className="block text-xs font-medium text-forest/70 mb-1">Store name (optional)</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Maxi, Idea, Shop..."
            className="w-full border border-forest/30 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta bg-charcoal text-beige placeholder-beige/50"
            disabled={isProcessing}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-forest/70 mb-1">Receipt URL</label>
          <div className="relative">
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://suf.purs.gov.rs/v/..."
              className="w-full border border-forest/30 p-2 pl-9 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta bg-charcoal text-beige placeholder-beige/50"
              disabled={isProcessing}
              required
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-forest/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing || !manualUrl.trim()}
          className="w-full bg-forest hover:bg-forest/90 disabled:bg-forest/30 text-beige font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
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
