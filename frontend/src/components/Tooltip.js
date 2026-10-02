import { useId, useState } from 'react';
import { createPortal } from 'react-dom';

// A small "i" button. The tooltip appears on hover or keyboard focus and is added
// to <body>, so it only exists in the page while it's showing.
export default function Tooltip({ label, text }) {
  const [pos, setPos] = useState(null);
  const id = useId();

  function show(e) {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ left: r.left + window.scrollX + r.width / 2, top: r.top + window.scrollY - 8 });
  }

  return (
    <>
      <button
        type="button"
        className="tooltip-trigger"
        aria-label={label}
        aria-describedby={pos ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        onFocus={show}
        onBlur={() => setPos(null)}
      >
        i
      </button>
      {pos && createPortal(
        <div
          role="tooltip"
          id={id}
          className="tooltip"
          style={{ left: pos.left, top: pos.top, transform: 'translate(-50%, -100%)' }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
}
