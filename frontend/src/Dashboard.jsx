import { useEffect, useMemo, useState } from "react";
import GridLayout from "react-grid-layout";
import { useShellyWs } from "./hooks/useShellyWs";
import AutoWidget from "./widgets/AutoWidget";
import { detectWidgetType } from "./widgets/detectWidgetType";
import { getLabel } from "./widgets/labelMap";

function defaultSize(type) {
    switch (type) {
        case "temperature": return { w: 2, h: 3 };
        case "power": return { w: 3, h: 2 };
        case "energy": return { w: 3, h: 2 };
        case "boolean": return { w: 2, h: 2 };
        default: return { w: 2, h: 2 };
    }
}

const DEFAULT_RANGES = {
    temperature: { min: 0, max: 100 },
    power: { min: 0, max: 1000 },
    energy: { min: 0, max: 10000 },
    voltage: { min: 0, max: 240 },
    current: { min: 0, max: 32 },
    number: { min: 0, max: 100 }
};

const DEFAULT_COLORS = {
    temperature: "#f97316",
    power: "#facc15",
    energy: "#38bdf8",
    voltage: "#60a5fa",
    current: "#22c55e",
    boolean: "#4ade80"
};

function defaultColor(type) {
    return DEFAULT_COLORS[type] ?? "#4fd1c5";
}

function defaultRange(type) {
    return DEFAULT_RANGES[type] ?? { min: 0, max: 100 };
}

function parseNumber(value) {
    if (value === "" || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export default function Dashboard() {
    const { metrics } = useShellyWs();
    const [widgetConfig, setWidgetConfig] = useState({});
    const [deletedMetrics, setDeletedMetrics] = useState([]);
    const [editingWidget, setEditingWidget] = useState(null);
    const [metricHistory, setMetricHistory] = useState({});
    const [formState, setFormState] = useState({
        title: "",
        color: "#4fd1c5",
        w: 2,
        h: 2,
        min: "",
        max: "",
        indicatorType: "bar",
        statsRange: "15"
    });

    useEffect(() => {
        if (!metrics) return;
        const timestamp = Date.now();
        setMetricHistory(prev => {
            const next = { ...prev };
            Object.entries(metrics).forEach(([key, value]) => {
                const entry = { t: timestamp, v: Number(value) };
                const existing = next[key] ?? [];
                const sanitized = Number.isFinite(entry.v) ? [...existing, entry] : existing;
                next[key] = sanitized.slice(-360);
            });
            return next;
        });
    }, [metrics]);

    const widgets = useMemo(() => {
        if (!metrics) return [];

        return Object.entries(metrics)
            .filter(([key]) => !deletedMetrics.includes(key))
            .map(([key, value], index) => {
            const type = detectWidgetType(value, key);
            const size = defaultSize(type);
            const config = widgetConfig[key] ?? {};

            return {
                i: key,
                metric: key,
                value,
                type,
                w: config.w ?? size.w,
                h: config.h ?? size.h,
                x: (index % 6) * 2,
                y: Math.floor(index / 6) * 2
            };
        });
    }, [metrics, widgetConfig, deletedMetrics]);

    const closeEditor = () => {
        setEditingWidget(null);
    };

    const openEditor = (widget) => {
        const config = widgetConfig[widget.metric] ?? {};
        const range = defaultRange(widget.type);

        setEditingWidget({ metric: widget.metric, type: widget.type });
        setFormState({
            title: config.title ?? getLabel(widget.metric),
            color: config.color ?? defaultColor(widget.type),
            w: config.w ?? widget.w,
            h: config.h ?? widget.h,
            min: config.min ?? range.min,
            max: config.max ?? range.max,
            indicatorType: config.indicatorType ?? "bar",
            statsRange: String(config.statsRange ?? "15")
        });
    };

    const saveChanges = () => {
        if (!editingWidget) return;
        const metric = editingWidget.metric;
        setWidgetConfig(prev => ({
            ...prev,
            [metric]: {
                title: formState.title,
                color: formState.color,
                w: parseNumber(formState.w) ?? 2,
                h: parseNumber(formState.h) ?? 2,
                min: parseNumber(formState.min),
                max: parseNumber(formState.max),
                indicatorType: formState.indicatorType,
                statsRange: parseNumber(formState.statsRange) ?? 15
            }
        }));
        closeEditor();
    };

    const deleteWidget = () => {
        if (!editingWidget) return;
        const metric = editingWidget.metric;
        setWidgetConfig(prev => {
            const next = { ...prev };
            delete next[metric];
            return next;
        });
        setDeletedMetrics(prev => (prev.includes(metric) ? prev : [...prev, metric]));
        closeEditor();
    };

    return (
        <>
            <GridLayout
                cols={12}
                rowHeight={60}
                margin={[12, 12]}
                width={window.innerWidth}
                draggableHandle=".widget-header"
                isResizable
                resizeHandles={["se"]}
                compactType={null}
                preventCollision={false}
            >
                {widgets.map(w => (
                    <div key={w.i} data-grid={w}>
                        <AutoWidget
                            metric={w.metric}
                            value={w.value}
                            type={w.type}
                            title={widgetConfig[w.metric]?.title}
                            color={widgetConfig[w.metric]?.color}
                            min={widgetConfig[w.metric]?.min}
                            max={widgetConfig[w.metric]?.max}
                            indicatorType={widgetConfig[w.metric]?.indicatorType}
                            statsRange={widgetConfig[w.metric]?.statsRange}
                            history={metricHistory[w.metric]}
                            onEdit={() => openEditor(w)}
                        />
                    </div>
                ))}
            </GridLayout>
            {editingWidget && (
                <div className="edit-overlay" onClick={closeEditor}>
                    <div className="edit-modal" onClick={(event) => event.stopPropagation()}>
                        <h3>Widget bearbeiten</h3>
                        <div className="edit-form">
                            <label>
                                Name
                                <input
                                    type="text"
                                    value={formState.title}
                                    onChange={(event) => setFormState(prev => ({ ...prev, title: event.target.value }))}
                                />
                            </label>
                            <label>
                                Farbe
                                <input
                                    type="color"
                                    value={formState.color}
                                    onChange={(event) => setFormState(prev => ({ ...prev, color: event.target.value }))}
                                />
                            </label>
                            <label>
                                Breite
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={formState.w}
                                    onChange={(event) => setFormState(prev => ({ ...prev, w: event.target.value }))}
                                />
                            </label>
                            <label>
                                Höhe
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={formState.h}
                                    onChange={(event) => setFormState(prev => ({ ...prev, h: event.target.value }))}
                                />
                            </label>
                            <label>
                                Min
                                <input
                                    type="number"
                                    value={formState.min}
                                    onChange={(event) => setFormState(prev => ({ ...prev, min: event.target.value }))}
                                />
                            </label>
                            <label>
                                Max
                                <input
                                    type="number"
                                    value={formState.max}
                                    onChange={(event) => setFormState(prev => ({ ...prev, max: event.target.value }))}
                                />
                            </label>
                            <label>
                                Indikator
                                <select
                                    value={formState.indicatorType}
                                    onChange={(event) => setFormState(prev => ({ ...prev, indicatorType: event.target.value }))}
                                >
                                    <option value="bar">Balken</option>
                                    <option value="circle">Kreis</option>
                                </select>
                            </label>
                            <label>
                                Statistik-Zeitraum (Minuten)
                                <input
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={formState.statsRange}
                                    onChange={(event) => setFormState(prev => ({ ...prev, statsRange: event.target.value }))}
                                />
                            </label>
                        </div>
                        <div className="edit-actions">
                            <button type="button" className="ghost" onClick={closeEditor}>
                                Abbrechen
                            </button>
                            <button type="button" className="danger" onClick={deleteWidget}>
                                Löschen
                            </button>
                            <button type="button" className="primary" onClick={saveChanges}>
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
