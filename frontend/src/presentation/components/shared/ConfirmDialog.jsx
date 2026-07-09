import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Модальное окно подтверждения/уведомления.
 *
 * Заменяет нативные window.confirm()/alert(), стилизовано под приложение.
 * Если cancelLabel не передан — режим «уведомление» (одна кнопка OK).
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {string} [props.title]
 * @param {string} [props.message]
 * @param {string} [props.confirmLabel='OK']
 * @param {string} [props.cancelLabel] — если задано, рисуется кнопка отмены
 * @param {boolean} [props.danger=false] — подтвердить «опасным» цветом (terracotta)
 * @param {Function} [props.onConfirm]
 * @param {Function} [props.onCancel]
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-beige rounded-2xl shadow-2xl p-5 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-lg font-bold text-forest mb-2">{title}</h2>}
        {message && <p className="text-sm text-forest/80 mb-5 whitespace-pre-line">{message}</p>}
        <div className="flex gap-2 justify-end">
          {cancelLabel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-forest/10 hover:bg-forest/20 text-forest font-medium text-sm transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white font-medium text-sm transition-colors ${danger ? 'bg-terracotta hover:bg-terracotta/90' : 'bg-forest hover:bg-forest/90'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
