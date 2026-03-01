import { Html5Qrcode } from 'html5-qrcode';

/**
 * Сервис для сканирования QR кодов
 */
export class QRScannerService {
  constructor() {
    this.scanner = null;
  }

  /**
   * Инициализирует сканер
   * @param {string} elementId - ID элемента для камеры
   */
  async init(elementId) {
    this.scanner = new Html5Qrcode(elementId);
  }

  /**
   * Запускает сканирование
   * @param {Function} onSuccess - Callback при успешном сканировании
   * @param {Function} onError - Callback при ошибке
   */
  async start(onSuccess, onError) {
    if (!this.scanner) {
      throw new Error('Scanner not initialized. Call init() first.');
    }

    await this.scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      onSuccess,
      onError
    );
  }

  /**
   * Останавливает сканирование
   */
  async stop() {
    if (this.scanner && this.scanner.isScanning) {
      await this.scanner.stop();
    }
  }

  /**
   * Очищает ресурсы
   */
  async clear() {
    if (this.scanner) {
      await this.scanner.clear();
      this.scanner = null;
    }
  }
}
