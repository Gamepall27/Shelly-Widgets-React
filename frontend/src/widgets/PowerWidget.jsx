import WidgetFrame from "./WidgetFrame";

export default function PowerWidget({ value }) {
  const safe = typeof value === "number" ? value : 0;
  const percent = Math.min(safe / 100, 1) * 100;

  return (
      <WidgetFrame title="Leistung" icon="⚡" color="#facc15">
        <div className="big-value">{safe.toFixed(1)} W</div>

        <div className="bar">
          <div
              className="bar-fill"
              style={{ width: `${percent}%` }}
          />
        </div>
      </WidgetFrame>
  );
}
