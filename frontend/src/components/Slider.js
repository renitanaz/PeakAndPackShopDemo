import { useEffect, useRef, useState } from 'react';

// A custom slider. Drag the knob, click the track, or use the arrow keys.
// It has role="slider" so assistive technology (and tests) can find it.
export default function Slider({ label, min, max, step, value, valueText, onChange }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const percent = ((value - min) / (max - min)) * 100;

  function setFromX(clientX) {
    const r = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    onChange(Math.round((min + ratio * (max - min)) / step) * step);
  }

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => setFromX(e.clientX);
    const up = () => setDragging(false);
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
  });

  function onKeyDown(e) {
    const keys = {
      ArrowRight: Math.min(max, value + step),
      ArrowUp: Math.min(max, value + step),
      ArrowLeft: Math.max(min, value - step),
      ArrowDown: Math.max(min, value - step),
      Home: min,
      End: max,
    };
    if (e.key in keys) {
      e.preventDefault();
      onChange(keys[e.key]);
    }
  }

  return (
    <div
      ref={trackRef}
      className="slider-track"
      onPointerDown={(e) => { e.preventDefault(); setFromX(e.clientX); setDragging(true); }}
    >
      <div
        className="slider-knob"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        onKeyDown={onKeyDown}
        style={{ left: `${percent}%` }}
      />
    </div>
  );
}
