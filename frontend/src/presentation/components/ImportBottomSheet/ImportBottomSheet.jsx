import { useRef, useState } from 'react';
import { BottomSheet } from '../shared/BottomSheet.jsx';
import { importReceiptFromJSON } from '../../../core/utils/receiptShare.js';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { useNavigate } from 'react-router-dom';

export function ImportBottomSheet({ isOpen, onClose }) {
  const fileInputRef = useRef(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { addReceipt, clearError } = useReceiptStore();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearError();
    setError(null);
    setIsParsing(true);

    try {
      const importedReceipt = await importReceiptFromJSON(file);

      const newReceipt = {
        ...importedReceipt,
        id: crypto.randomUUID(),
        importedAt: new Date().toISOString()
      };

      addReceipt(newReceipt);
      onClose();
      navigate(`/receipt/${newReceipt.id}`);
    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import receipt. Please check the file format.');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-forest">Import Receipt</h2>

        {isParsing && (
          <div className="p-3 bg-forest/10 rounded-lg">
            <div className="flex items-center mb-2">
              <svg className="animate-spin h-4 w-4 text-forest mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-forest text-sm font-medium">Importing...</span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleImportClick}
          disabled={isParsing}
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
