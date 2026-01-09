import WidgetFrame from "./WidgetFrame";
import TemperatureIndicator from "./TemperatureIndicator";
import { getLabel } from "./labelMap";

function clampValue(value, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(Math.max(numeric, min), max);
}

function toPercent(value, min, max) {
    const safeMax = max <= min ? min + 1 : max;
    const clamped = clampValue(value, min, safeMax);
    return ((clamped - min) / (safeMax - min)) * 100;
}

function Bar({ value = 0, min = 0, max = 1000 }) {
    const p = toPercent(value, min, max);
    return (
        <div className="bar">
            <div className="bar-fill" style={{ width: `${p}%` }} />
        </div>
    );
}

function CircleIndicator({ value = 0, min = 0, max = 100 }) {
    const p = toPercent(value, min, max);
    return (
        <div className="circle-indicator" style={{ "--percent": `${p}%` }}>
            <div className="circle-indicator-inner" />
        </div>
    );
}

function Led({ on }) {
    return <div className={`led ${on ? "on" : "off"}`} />;
}

function defaultRangeFor(type) {
    switch (type) {
        case "temperature":
            return { min: -10, max: 40 };
        case "power":
            return { min: 0, max: 1000 };
        case "energy":
            return { min: 0, max: 10000 };
        case "voltage":
            return { min: 0, max: 250 };
        case "current":
            return { min: 0, max: 16 };
        default:
            return { min: 0, max: 100 };
    }
}

function defaultIndicatorFor(type) {
    switch (type) {
        case "temperature":
            return "thermo";
        case "boolean":
            return "led";
        default:
            return "bar";
    }
}

export default function AutoWidget({
    metric,
    value,
    type,
    title,
    color,
    min,
    max,
    indicatorType,
    onDoubleClick
}) {
    const range = defaultRangeFor(type);
    const resolvedMin = Number.isFinite(min) ? min : range.min;
    const resolvedMax = Number.isFinite(max) ? max : range.max;
    const resolvedIndicator = indicatorType ?? defaultIndicatorFor(type);
    return (
        <WidgetFrame
            title={title ?? getLabel(metric)}
            icon={iconFor(type)}
            color={color ?? colorFor(type)}
            onDoubleClick={onDoubleClick}
        >
            <div className="widget-body">
                {type === "temperature" && (
                    <>
                        {resolvedIndicator === "thermo" && (
                            <TemperatureIndicator value={value} min={resolvedMin} max={resolvedMax} />
                        )}
                        {resolvedIndicator === "circle" && (
                            <CircleIndicator value={value} min={resolvedMin} max={resolvedMax} />
                        )}
                        {resolvedIndicator === "bar" && (
                            <Bar value={value} min={resolvedMin} max={resolvedMax} />
                        )}
                        <div className="big-value">{value?.toFixed(1)} °C</div>
                    </>
                )}

                {type === "power" && (
                    <>
                        <div className="big-value">{value?.toFixed(1)} W</div>
                        {resolvedIndicator === "circle" ? (
                            <CircleIndicator value={value} min={resolvedMin} max={resolvedMax} />
                        ) : (
                            <Bar value={value} min={resolvedMin} max={resolvedMax} />
                        )}
                    </>
                )}

                {type === "energy" && (
                    <>
                        <div className="big-value">{value?.toFixed(1)} Wh</div>
                        {resolvedIndicator === "circle" ? (
                            <CircleIndicator value={value} min={resolvedMin} max={resolvedMax} />
                        ) : (
                            <Bar value={value} min={resolvedMin} max={resolvedMax} />
                        )}
                    </>
                )}

                {type === "boolean" && (
                    <>
                        <Led on={value} />
                        <div className="big-value">{value ? "EIN" : "AUS"}</div>
                    </>
                )}

                {type === "voltage" && (
                    <>
                        <div className="big-value">{value?.toFixed(1)} V</div>
                        {resolvedIndicator === "circle" ? (
                            <CircleIndicator value={value} min={resolvedMin} max={resolvedMax} />
                        ) : (
                            <Bar value={value} min={resolvedMin} max={resolvedMax} />
                        )}
                    </>
                )}

                {type === "current" && (
                    <>
                        <div className="big-value">{value?.toFixed(2)} A</div>
                        {resolvedIndicator === "circle" ? (
                            <CircleIndicator value={value} min={resolvedMin} max={resolvedMax} />
                        ) : (
                            <Bar value={value} min={resolvedMin} max={resolvedMax} />
                        )}
                    </>
                )}

                {type === "number" && (
                    <>
                        <div className="big-value">{value}</div>
                        {resolvedIndicator === "circle" ? (
                            <CircleIndicator value={value} min={resolvedMin} max={resolvedMax} />
                        ) : (
                            <Bar value={value} min={resolvedMin} max={resolvedMax} />
                        )}
                    </>
                )}
            </div>
        </WidgetFrame>
    );
}

function iconFor(type) {
    return {
        temperature: "🌡",
        power: "⚡",
        energy: "🔋",
        voltage: "🔌",
        current: "🔁",
        boolean: "🔘"
    }[type] ?? "📊";
}

function colorFor(type) {
    return {
        temperature: "#f97316",
        power: "#facc15",
        energy: "#38bdf8",
        voltage: "#60a5fa",
        current: "#22c55e",
        boolean: "#4ade80"
    }[type] ?? "#4fd1c5";
}
