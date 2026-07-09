import { useRef, useEffect, useState } from 'react';

export function DropdownMenu({ trigger, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden z-50 bg-beige border border-forest/15 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-full text-left flex items-center gap-2 transition-colors p-2 pl-2.5 text-forest text-sm font-normal hover:bg-forest/10 ${
                index < items.length - 1 ? 'border-b border-forest/10' : ''
              }`}
            >
              <div className="w-4 h-4 text-forest">
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
