import { useRef } from 'react';

// Rounded pill selector — unselected (cream, brown border), selected (deep
// brown, cream text), unavailable (reduced opacity). Per design system §10/§7.
export default function PillSelector({ options, value, onChange, disabled = false, ariaLabel }) {
  const rootRef = useRef(null);
  const selectedIndex = options.findIndex((option) => option.id === value);
  function handleKeyDown(event, index) {
    const offsets = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (disabled || !options.length || !(event.key in offsets || event.key === 'Home' || event.key === 'End')) return;
    event.preventDefault();
    const nextIndex =
      event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + offsets[event.key] + options.length) % options.length;
    onChange(options[nextIndex].id);
    rootRef.current?.querySelectorAll('[role="radio"]')[nextIndex]?.focus();
  }
  return (
    <div ref={rootRef} role="radiogroup" aria-label={ariaLabel} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {options.map((opt, index) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (selectedIndex === -1 && index === 0) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            style={{
              padding: '10px 20px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: selected ? 'var(--color-choc)' : 'var(--color-white)',
              color: selected ? 'var(--color-white)' : 'var(--color-choc)',
              border: `1.5px solid ${selected ? 'var(--color-choc)' : 'var(--color-border)'}`,
              opacity: disabled ? 0.4 : 1,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
