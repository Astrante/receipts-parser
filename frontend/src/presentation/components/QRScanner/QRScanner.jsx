import { useEffect, useRef, useState } from 'react';
import { QRScannerService } from '../../../core/services/QRScanner.js';
import { ReceiptParserService } from '../../../core/services/ReceiptParser.js';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { useNavigate } from 'react-router-dom';

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [manualUrl, setManualUrl] = useState('');
  const [storeName, setStoreName] = useState('');
  const serviceRef = useRef(null);
  const navigate = useNavigate();

  const { addReceipt, setLoading, setError: setStoreError } = useReceiptStore();

  useEffect(() => {
    const service = new QRScannerService();
    serviceRef.current = service;

    service.init('qr-reader');

    return () => {
      service.clear();
    };
  }, []);

  const handleStartScan = async () => {
    try {
      setIsScanning(true);
      setError(null);

      await serviceRef.current.start(
        async (decodedText) => {
          await serviceRef.current.stop();
          setIsScanning(false);

          setLoading(true);
          try {
            const parser = new ReceiptParserService();
            const receipt = await parser.parseFromUrl(decodedText, storeName.trim() || null);
            addReceipt(receipt);
            setStoreName(''); // Clear store name after successful scan
            navigate(`/receipt/${receipt.id}`);
          } catch (err) {
            setStoreError(err.message);
            setLoading(false);
          }
        },
        (err) => {
          // Игнорируем ошибки сканирования (шум камеры и т.д.)
        }
      );
    } catch (err) {
      setError('Failed to start camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const handleStopScan = async () => {
    await serviceRef.current.stop();
    setIsScanning(false);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;

    setLoading(true);
    try {
      const parser = new ReceiptParserService();
      const receipt = await parser.parseFromUrl(manualUrl, storeName.trim() || null);
      addReceipt(receipt);
      setManualUrl('');
      setStoreName(''); // Clear store name after successful parsing
      navigate(`/receipt/${receipt.id}`);
    } catch (err) {
      setStoreError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Scan QR Code</h1>

          {/* Store Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Name (optional)
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g., Maxi, Idea, Shop..."
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* QR Scanner */}
          <div id="qr-reader" className="mb-4"></div>

          {!isScanning ? (
            <button
              onClick={handleStartScan}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={handleStopScan}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Stop Scanning
            </button>
          )}

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Manual Input */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Enter URL manually:</h2>
            <form onSubmit={handleManualSubmit}>
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://suf.purs.gov.rs/v/..."
                className="w-full border border-gray-300 p-3 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Parse Receipt
              </button>
            </form>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
