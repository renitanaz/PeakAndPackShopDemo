// A radio button or checkbox. The real input is visually hidden and a styled
// span (the "mark") is shown instead, which is how most design systems do it.
export default function Choice({ type, name, value, label, checked, disabled, onChange }) {
  return (
    <label className="choice">
      <input
        className="visually-hidden"
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className={`mark${type === 'radio' ? ' round' : ''}`} />
      <span className="text">{label}</span>
    </label>
  );
}
