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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Сканировать QR код</h1>

          {/* Loading / Parsing Progress */}
          {(isParsing || isLoading) && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center mb-3">
                <svg className="animate-spin h-6 w-6 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-blue-700 font-medium">Обработка чека...</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
              <p className="text-blue-600 text-sm mt-2 text-center">Получение данных с сервера...</p>
            </div>
          )}

          {/* Store Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название магазина (необязательно)
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Например: Maxi, Idea, Shop..."
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isParsing || isLoading}
            />
          </div>

          {/* QR Scanner */}
          <div id="qr-reader" className="mb-4"></div>

          {!isScanning ? (
            <button
              onClick={handleStartScan}
              disabled={isParsing || isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Включить камеру
            </button>
          ) : (
            <button
              onClick={handleStopScan}
              disabled={isParsing || isLoading}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Остановить сканирование
            </button>
          )}

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">ИЛИ</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Import JSON */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Импортировать из JSON:</h2>
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
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Выбрать файл
            </button>
          </div>

          {/* Manual Input */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Введите ссылку вручную:</h2>
            <form onSubmit={handleManualSubmit}>
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://suf.purs.gov.rs/v/..."
                className="w-full border border-gray-300 p-3 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isParsing || isLoading}
                required
              />
              <button
                type="submit"
                disabled={isParsing || isLoading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Распарсить чек
              </button>
            </form>
          </div>

          {/* Error Display */}
          {(error || storeError) && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-700 font-medium text-sm mb-1">Ошибка</p>
                  <p className="text-red-600 text-sm">{error || storeError}</p>
                </div>
                <button
                  onClick={() => {
                    setError(null);
                    clearError();
                  }}
                  className="text-red-400 hover:text-red-600 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">
              <strong>Как использовать:</strong><br />
              1. Нажмите "Включить камеру" и наведите на QR код чека<br />
              2. Или выберите JSON файл для импорта<br />
              3. Или вставьте ссылку с чека в поле выше
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
