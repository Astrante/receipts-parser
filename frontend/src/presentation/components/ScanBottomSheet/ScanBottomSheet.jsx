import { useState, useRef, useEffect } from 'react';
import { BottomSheet } from '../shared/BottomSheet.jsx';
import { Spinner } from '../shared/Spinner.jsx';
import { QRScannerService } from '../../../core/services/QRScanner.js';
import { useNavigate } from 'react-router-dom';
import { useAddReceipt } from '../../hooks/useAddReceipt.js';

export function ScanBottomSheet({ isOpen, onClose }) {
  const [storeName, setStoreName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const serviceRef = useRef(null);
  const navigate = useNavigate();
  const { isProcessing, error, setError, addFromUrl } = useAddReceipt();

  useEffect(() => {
    if (!isOpen) return;

    const service = new QRScannerService();
    serviceRef.current = service;

    const readerElement = document.getElementById('qr-reader-sheet');
    if (readerElement) {
      service.init('qr-reader-sheet');
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.clear();
      }
    };
  }, [isOpen]);

  const handleStartScan = async () => {
    setError(null);

    try {
      setIsScanning(true);

      await serviceRef.current.start(
        async (decodedText) => {
          await serviceRef.current.stop();
          setIsScanning(false);

          try {
            const receipt = await addFromUrl(decodedText, storeName.trim() || null);
            setStoreName('');
            onClose();
            navigate(`/receipt/${receipt.id}`);
          } catch {
            // Ошибка уже выставлена в error из useAddReceipt.
          }
        },
        () => {
          // Шум камеры и прочие ошибки сканирования игнорируем.
        }
      );
    } catch (err) {
      console.error('Camera error:', err);
      setError('Не удалось включить камеру. Проверьте разрешения.');
      setIsScanning(false);
    }
  };

  const handleStopScan = async () => {
    if (serviceRef.current) {
      await serviceRef.current.stop();
    }
    setIsScanning(false);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-forest">Scan Receipt</h2>

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

        <div id="qr-reader-sheet" className="overflow-hidden rounded-lg"></div>

        {!isScanning ? (
          <button
            onClick={handleStartScan}
            disabled={isProcessing}
            className="w-full bg-forest hover:bg-forest/90 disabled:bg-forest/30 text-beige font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Scan
          </button>
        ) : (
          <button
            onClick={handleStopScan}
            disabled={isProcessing}
            className="w-full bg-terracotta hover:bg-terracotta/80 disabled:bg-forest/30 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Stop
          </button>
        )}

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
