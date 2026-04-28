import { useState } from 'react';
import { generateShareUrl, exportReceiptToJSON } from '../../../core/utils/receiptShare.js';

export function ShareButtons({ receipt }) {
  const [copied, setCopied] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);

  const handleShareLink = () => {
    try {
      const shareUrl = generateShareUrl(receipt);
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setShowShareLink(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (error) {
      console.error('Failed to copy share link:', error);
      alert('Failed to generate share link');
    }
  };

  const handleExportJSON = () => {
    try {
      exportReceiptToJSON(receipt);
    } catch (error) {
      console.error('Failed to export receipt:', error);
      alert('Failed to export receipt');
    }
  };

  const shareUrl = showShareLink ? generateShareUrl(receipt) : '';

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={handleShareLink}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {copied ? 'Ссылка скопирована!' : 'Поделиться ссылкой'}
        </button>

        <button
          onClick={handleExportJSON}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Скачать JSON
        </button>
      </div>

      {showShareLink && (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Ссылка для sharing:</p>
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="w-full text-xs bg-white border border-gray-300 rounded px-2 py-1 text-gray-700"
            onClick={(e) => e.target.select()}
          />
          <p className="text-xs text-gray-400 mt-1">
            Отправьте эту ссылку другу. Он сможет просмотреть чек в приложении.
          </p>
        </div>
      )}
    </div>
  );
}
