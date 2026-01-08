import WidgetFrame from "./WidgetFrame";

export default function TemperatureWidget({ value }) {
  const safe = typeof value === "number" ? value : 0;

  const color =
      safe > 70 ? "#ef4444" :
          safe > 50 ? "#f97316" :
              "#22c55e";

  return (
      <WidgetFrame title="Temperatur" icon="🌡" color={color}>
        <div className="big-value">{safe.toFixed(1)} °C</div>
      </WidgetFrame>
  );
}
