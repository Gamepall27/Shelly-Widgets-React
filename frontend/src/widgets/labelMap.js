export const LABELS = {
    apower: "Leistung",
    voltage: "Spannung",
    current: "Strom",
    energyWh: "Energie",
    temperatureC: "Temperatur",
    output: "Schalter"
};

export function getLabel(key) {
    return LABELS[key] ?? key;
}
