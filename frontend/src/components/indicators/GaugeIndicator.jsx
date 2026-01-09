export default function GaugeIndicator({ value, max, unit }) {
  const percent = Math.min(100, (value / max) * 100);

  return (
    <div className="gauge">
      <svg viewBox="0 0 100 50">
        <path d="M10 50 A40 40 0 0 1 90 50" className="gauge-bg" />
        <path
          d="M10 50 A40 40 0 0 1 90 50"
          className="gauge-fg"
          strokeDasharray={`${percent} 100`}
        />
      </svg>
      <div className="gauge-value">
        {value?.toFixed(1)} {unit}
      </div>
    </div>
  );
}
