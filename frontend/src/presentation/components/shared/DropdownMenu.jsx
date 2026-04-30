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
        <div className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden shadow-lg z-50 border" style={{
          backgroundColor: '#F5E6CC',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          borderColor: 'rgba(45,79,30,0.15)'
        }}>
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className="w-full text-left flex items-center gap-2 transition-colors"
              style={{
                padding: '8px 8px 8px 10px',
                borderBottom: index < items.length - 1 ? '0.5px solid rgba(45,79,30,0.12)' : 'none',
                color: '#2D4F1E',
                fontSize: '14px',
                fontWeight: '400'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(45,79,30,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ width: '16px', height: '16px', color: '#2D4F1E' }}>
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
