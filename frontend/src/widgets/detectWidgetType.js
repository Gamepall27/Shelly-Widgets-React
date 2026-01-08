export function detectWidgetType(value, key) {
    if (typeof value === "boolean") return "boolean";

    const k = key.toLowerCase();

    if (k.includes("temp")) return "temperature";
    if (k.includes("power")) return "power";
    if (k.includes("energy")) return "energy";
    if (k.includes("volt")) return "voltage";
    if (k.includes("current")) return "current";

    return "number";
}
