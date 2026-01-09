export default function ThermometerIndicator({ value, min, max, color }) {
  const percent = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100)
  );

  return (
    <div className="thermometer">
      <div
        className="thermometer-fill"
        style={{ height: `${percent}%`, background: color }}
      />
      <span className="thermo-value">{value?.toFixed(1)} °C</span>
    </div>
  );
}
