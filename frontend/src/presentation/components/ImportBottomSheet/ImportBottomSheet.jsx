import { useRef } from 'react';
import { BottomSheet } from '../shared/BottomSheet.jsx';
import { Spinner } from '../shared/Spinner.jsx';
import { useNavigate } from 'react-router-dom';
import { useAddReceipt } from '../../hooks/useAddReceipt.js';

export function ImportBottomSheet({ isOpen, onClose }) {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { isProcessing, error, addFromJsonFile } = useAddReceipt();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const receipt = await addFromJsonFile(file);
      onClose();
      navigate(`/receipt/${receipt.id}`);
    } catch {
      // Ошибка уже выставлена в error из useAddReceipt.
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-forest">Import Receipt</h2>

        {isProcessing && <Spinner label="Importing..." />}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleImportClick}
          disabled={isProcessing}
          className="w-full bg-forest hover:bg-forest/90 disabled:bg-forest/30 text-beige font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Choose JSON File
        </button>

        <div className="p-3 bg-forest/5 rounded-lg border border-forest/20">
          <p className="text-xs text-forest/70 leading-relaxed">
            Select a JSON file previously exported from the app to import a receipt.
          </p>
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
