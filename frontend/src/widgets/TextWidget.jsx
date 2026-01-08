import WidgetFrame from "./WidgetFrame";

export default function TextWidget({ value, title }) {
    let display = "—";

    if (value !== null && value !== undefined) {
        if (typeof value === "number") {
            display = value.toString();
        } else if (typeof value === "boolean") {
            display = value ? "true" : "false";
        } else {
            display = String(value);
        }
    }

    return (
        <WidgetFrame
            title={title}
            icon="📄"
            color="#60a5fa"
        >
            <div className="big-value">{display}</div>
        </WidgetFrame>
    );
}
