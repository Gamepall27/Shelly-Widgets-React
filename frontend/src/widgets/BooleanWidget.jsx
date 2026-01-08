import WidgetFrame from "./WidgetFrame";

export default function BooleanWidget({ value, title }) {
    const on = Boolean(value);

    return (
        <WidgetFrame
            title={title}
            icon={on ? "🟢" : "⚪"}
            color={on ? "#22c55e" : "#64748b"}
        >
            <div className="big-value">
                {on ? "EIN" : "AUS"}
            </div>
        </WidgetFrame>
    );
}
