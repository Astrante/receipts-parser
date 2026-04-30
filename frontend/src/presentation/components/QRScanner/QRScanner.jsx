import { useEffect, useRef, useState } from 'react';
import { QRScannerService } from '../../../core/services/QRScanner.js';
import { ReceiptParserService } from '../../../core/services/ReceiptParser.js';
import { useReceiptStore } from '../../../store/receiptStore.js';
import { useNavigate } from 'react-router-dom';
import { importReceiptFromJSON } from '../../../core/utils/receiptShare.js';

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);
  const [manualUrl, setManualUrl] = useState('');
  const [storeName, setStoreName] = useState('');
  const fileInputRef = useRef(null);
  const serviceRef = useRef(null);
  const navigate = useNavigate();

  const { addReceipt, setLoading, setError: setStoreError, isLoading, error: storeError, clearError } = useReceiptStore();

  useEffect(() => {
    const service = new QRScannerService();
    serviceRef.current = service;

    service.init('qr-reader');

    return () => {
      service.clear();
    };
  }, []);

  const handleStartScan = async () => {
    clearError();
    setError(null);

    try {
      setIsScanning(true);

      await serviceRef.current.start(
        async (decodedText) => {
          await serviceRef.current.stop();
          setIsScanning(false);
          setIsParsing(true);

          try {
            const parser = new ReceiptParserService();
            const receipt = await parser.parseFromUrl(decodedText, storeName.trim() || null);
            addReceipt(receipt);
            setStoreName('');
            navigate(`/receipt/${receipt.id}`);
          } catch (err) {
            console.error('Parse error:', err);
            setError(getUserFriendlyError(err.message));
          } finally {
            setIsParsing(false);
          }
        },
        (err) => {
          // Игнорируем ошибки сканирования (шум камеры и т.д.)
        }
      );
    } catch (err) {
      console.error('Camera error:', err);
      setError('Не удалось включить камеру. Проверьте разрешения в настройках браузера.');
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

    clearError();
    setError(null);
    setIsParsing(true);

    try {
      const parser = new ReceiptParserService();
      const receipt = await parser.parseFromUrl(manualUrl, storeName.trim() || null);
      addReceipt(receipt);
      setManualUrl('');
      setStoreName('');
      navigate(`/receipt/${receipt.id}`);
    } catch (err) {
      console.error('Parse error:', err);
      setError(getUserFriendlyError(err.message));
    } finally {
      setIsParsing(false);
    }
  };

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

  const getUserFriendlyError = (errorMessage) => {
    if (errorMessage.includes('Failed to parse receipt') || errorMessage.includes('Invalid receipt URL')) {
      return 'Не удалось прочитать чек. Убедитесь, что ссылка правильная и попробуйте снова.';
    }
    if (errorMessage.includes('Invalid receipt data format')) {
      return 'Чек имеет неправильный формат. Возможно, чек устарел или недействителен.';
    }
    if (errorMessage.includes('Failed to fetch receipt')) {
      return 'Не удалось получить данные чека с сервера. Проверьте подключение к интернету.';
    }
    if (errorMessage.includes('Failed to fetch receipt specifications')) {
      return 'Не удалось получить детали продуктов. Возможно, чек еще не обработан системой.';
    }
    if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
      return 'Ошибка подключения к интернету. Проверьте соединение и попробуйте снова.';
    }
    return errorMessage || 'Произошла ошибка. Попробуйте снова.';
  };

  return (
    <div className="min-h-screen bg-forest p-3">
      <div className="max-w-md mx-auto">
        <div className="bg-beige rounded-lg p-4 shadow-xl">
          <h1 className="text-xl font-bold mb-3 text-center text-forest">Scan QR Code</h1>

          {(isParsing || isLoading) && (
            <div className="mb-4 p-3 bg-forest/10 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <svg className="animate-spin h-5 w-5 text-forest mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-forest font-medium text-sm">Processing...</span>
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="block text-xs font-medium text-forest/70 mb-1">
              Store name (optional)
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Maxi, Idea, Shop..."
              className="w-full border border-forest/30 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta bg-white"
              disabled={isParsing || isLoading}
            />
          </div>

          <div id="qr-reader" className="mb-3 overflow-hidden rounded-lg"></div>

          {!isScanning ? (
            <button
              onClick={handleStartScan}
              disabled={isParsing || isLoading}
              className="w-full bg-forest hover:bg-forest/90 disabled:bg-forest/30 text-beige font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
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
              disabled={isParsing || isLoading}
              className="w-full bg-terracotta hover:bg-terracotta/80 disabled:bg-forest/30 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Stop
            </button>
          )}

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-forest/20"></div>
            <span className="px-3 text-forest/60 text-xs">OR</span>
            <div className="flex-1 border-t border-forest/20"></div>
          </div>

          <div className="mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              disabled={isParsing || isLoading}
              className="w-full bg-forest/10 hover:bg-forest/20 disabled:bg-forest/30 text-forest font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import JSON
            </button>
          </div>

          <div>
            <form onSubmit={handleManualSubmit}>
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://suf.purs.gov.rs/v/..."
                className="w-full border border-forest/30 p-2 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-terracotta bg-white"
                disabled={isParsing || isLoading}
                required
              />
              <button
                type="submit"
                disabled={isParsing || isLoading}
                className="w-full bg-forest/10 hover:bg-forest/20 disabled:bg-forest/30 text-forest font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </form>
          </div>

          {(error || storeError) && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-xs">{error || storeError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
