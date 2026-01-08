import WidgetFrame from "./WidgetFrame";
import TemperatureIndicator from "./TemperatureIndicator";
import { getLabel } from "./labelMap";

function Bar({ value = 0, max = 1000 }) {
    const p = Math.min(value / max, 1) * 100;
    return (
        <div className="bar">
            <div className="bar-fill" style={{ width: `${p}%` }} />
        </div>
    );
}

function Led({ on }) {
    return <div className={`led ${on ? "on" : "off"}`} />;
}

export default function AutoWidget({ metric, value, type }) {
    return (
        <WidgetFrame
            title={getLabel(metric)}
            icon={iconFor(type)}
            color={colorFor(type)}
        >
            <div className="widget-body">
                {type === "temperature" && (
                    <>
                        <TemperatureIndicator value={value} />
                        <div className="big-value">{value?.toFixed(1)} °C</div>
                    </>
                )}

                {type === "power" && (
                    <>
                        <div className="big-value">{value?.toFixed(1)} W</div>
                        <Bar value={value} max={1000} />
                    </>
                )}

                {type === "energy" && (
                    <>
                        <div className="big-value">{value?.toFixed(1)} Wh</div>
                        <Bar value={value} max={10000} />
                    </>
                )}

                {type === "boolean" && (
                    <>
                        <Led on={value} />
                        <div className="big-value">{value ? "EIN" : "AUS"}</div>
                    </>
                )}

                {type === "voltage" && (
                    <div className="big-value">{value?.toFixed(1)} V</div>
                )}

                {type === "current" && (
                    <div className="big-value">{value?.toFixed(2)} A</div>
                )}

                {type === "number" && (
                    <div className="big-value">{value}</div>
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
