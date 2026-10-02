import { useState } from 'react';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function formatDate(d) {
  return d.toLocaleString('en-US', { month: 'short' }) + ' ' + d.getDate() + ', ' + d.getFullYear();
}

// A date picker: a read-only field that opens a calendar. The calendar always shows six
// weeks, so it includes days from the previous and next month (class "bounding-month").
// Days before tomorrow are disabled.
export default function DatePicker({ id, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  function shiftMonth(delta) {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }

  const offset = (view.getDay() + 6) % 7; // weeks start on Monday
  const cells = Array.from({ length: 42 }, (_, i) =>
    new Date(view.getFullYear(), view.getMonth(), 1 - offset + i)
  );

  return (
    <div className="picker">
      <input
        id={id}
        readOnly
        placeholder="Pick a date"
        value={value ? formatDate(value) : ''}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        style={{ padding: 8 }}
      />
      {open && (
        <div className="calendar" role="dialog" aria-label="Choose a delivery date">
          <div className="calendar-head">
            <button type="button" className="nav-btn prev-month" aria-label="Previous month" onClick={() => shiftMonth(-1)}>&lsaquo;</button>
            <span className="calendar-title">
              {view.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" className="nav-btn next-month" aria-label="Next month" onClick={() => shiftMonth(1)}>&rsaquo;</button>
          </div>
          <div className="calendar-grid">
            {WEEKDAYS.map((w) => <span key={w} className="weekday">{w}</span>)}
            {cells.map((d) => {
              const outside = d.getMonth() !== view.getMonth();
              const selected = value && d.toDateString() === value.toDateString();
              return (
                <button
                  type="button"
                  key={d.getTime()}
                  className={`day-cell${outside ? ' bounding-month' : ''}${selected ? ' selected' : ''}`}
                  disabled={d < tomorrow}
                  onClick={() => { onChange(d); setOpen(false); }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
