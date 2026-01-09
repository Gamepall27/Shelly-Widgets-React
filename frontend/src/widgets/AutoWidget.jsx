import WidgetFrame from "./WidgetFrame";
import TemperatureIndicator from "./TemperatureIndicator";
import { getLabel } from "./labelMap";

function clampPercent(value, min, max) {
    const range = max - min;
    if (range <= 0) return 0;
    return Math.min(Math.max((value - min) / range, 0), 1) * 100;
}

function Bar({ value = 0, min = 0, max = 1000 }) {
    const p = clampPercent(value, min, max);
    return (
        <div className="bar">
            <div className="bar-fill" style={{ width: `${p}%` }} />
        </div>
    );
}

function CircleIndicator({ value = 0, min = 0, max = 100 }) {
    const percent = clampPercent(value, min, max);
    return (
        <div className="circle-indicator" style={{ "--progress": `${percent}%` }}>
            <div className="circle-center">{Math.round(percent)}%</div>
        </div>
    );
}

function Led({ on }) {
    return <div className={`led ${on ? "on" : "off"}`} />;
}

const DEFAULT_RANGES = {
    temperature: { min: 0, max: 100 },
    power: { min: 0, max: 1000 },
    energy: { min: 0, max: 10000 },
    voltage: { min: 0, max: 240 },
    current: { min: 0, max: 32 },
    number: { min: 0, max: 100 }
};

function getRange(type, min, max) {
    const fallback = DEFAULT_RANGES[type] ?? { min: 0, max: 100 };
    return {
        min: Number.isFinite(min) ? min : fallback.min,
        max: Number.isFinite(max) ? max : fallback.max
    };
}

export default function AutoWidget({ metric, value, type, title, color, min, max, indicatorType = "bar", onEdit }) {
    const range = getRange(type, min, max);
    return (
        <WidgetFrame
            title={title ?? getLabel(metric)}
            icon={iconFor(type)}
            color={color ?? colorFor(type)}
            onDoubleClick={onEdit}
        >
            <div className="widget-body">
                {type === "temperature" && (
                    <>
                        {indicatorType === "circle" ? (
                            <CircleIndicator value={value} min={range.min} max={range.max} />
                        ) : (
                            <TemperatureIndicator value={value} min={range.min} max={range.max} />
                        )}
                        <div className="big-value">{value?.toFixed(1)} °C</div>
                    </>
                )}

                {type === "power" && (
                    <>
                        <div className="big-value">{value?.toFixed(1)} W</div>
                        {indicatorType === "circle" ? (
                            <CircleIndicator value={value} min={range.min} max={range.max} />
                        ) : (
                            <Bar value={value} min={range.min} max={range.max} />
                        )}
                    </>
                )}

                {type === "energy" && (
                    <>
                        <div className="big-value">{value?.toFixed(1)} Wh</div>
                        {indicatorType === "circle" ? (
                            <CircleIndicator value={value} min={range.min} max={range.max} />
                        ) : (
                            <Bar value={value} min={range.min} max={range.max} />
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
                        {indicatorType === "circle" ? (
                            <CircleIndicator value={value} min={range.min} max={range.max} />
                        ) : (
                            <Bar value={value} min={range.min} max={range.max} />
                        )}
                    </>
                )}

                {type === "current" && (
                    <>
                        <div className="big-value">{value?.toFixed(2)} A</div>
                        {indicatorType === "circle" ? (
                            <CircleIndicator value={value} min={range.min} max={range.max} />
                        ) : (
                            <Bar value={value} min={range.min} max={range.max} />
                        )}
                    </>
                )}

                {type === "number" && (
                    <>
                        <div className="big-value">{value}</div>
                        {indicatorType === "circle" ? (
                            <CircleIndicator value={value} min={range.min} max={range.max} />
                        ) : (
                            <Bar value={value} min={range.min} max={range.max} />
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
