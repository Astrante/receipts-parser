import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function BottomSheet({ isOpen, onClose, children }) {
  const sheetRef = useRef(null);
  const overlayRef = useRef(null);
  const touchStartRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const handleTouchStart = (e) => {
      touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!touchStartRef.current || !sheetRef.current) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartRef.current;

      if (diff > 0) {
        sheetRef.current.style.transform = `translateY(${diff}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (!sheetRef.current || !touchStartRef.current) return;

      const transform = sheetRef.current.style.transform;
      const match = transform.match(/translateY\((\d+)px\)/);
      const translateY = match ? parseInt(match[1]) : 0;

      if (translateY > 100) {
        onClose();
      } else {
        sheetRef.current.style.transform = '';
      }
      touchStartRef.current = null;
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
    >
      <div
        ref={sheetRef}
        className="w-full max-w-lg bg-beige rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1.5 bg-forest/30 rounded-full" />
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
