import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// A custom dropdown: a button, plus a list of options added to <body> while it's open.
// Because the list lives outside the component, it isn't "inside" the button in the DOM.
export default function Dropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e) {
      const insideList = e.target.closest && e.target.closest('[data-dropdown-list]');
      if (!buttonRef.current.contains(e.target) && !insideList) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function toggle() {
    const r = buttonRef.current.getBoundingClientRect();
    setPos({ left: r.left + window.scrollX, top: r.bottom + window.scrollY + 4 });
    setOpen((o) => !o);
  }

  return (
    <>
      <button
        type="button"
        className="dropdown-button"
        ref={buttonRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
      >
        {label}: {value}
      </button>
      {open && createPortal(
        <ul role="listbox" aria-label={label} className="overlay" data-dropdown-list style={{ left: pos.left, top: pos.top }}>
          {options.map((option) => (
            <li
              key={option}
              role="option"
              aria-selected={option === value}
              onClick={() => { onChange(option); setOpen(false); }}
            >
              {option}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </>
  );
}
