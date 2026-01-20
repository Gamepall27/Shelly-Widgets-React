import { useEffect, useMemo, useState } from "react";
import GridLayout from "react-grid-layout";
import { ResizableBox } from "react-resizable";
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

function defaultColorFor(type) {
    return {
        temperature: "#f97316",
        power: "#facc15",
        energy: "#38bdf8",
        voltage: "#60a5fa",
        current: "#22c55e",
        boolean: "#4ade80"
    }[type] ?? "#4fd1c5";
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

export default function Dashboard() {
    const { metrics } = useShellyWs();
    const [widgetConfigs, setWidgetConfigs] = useState({});
    const [editorState, setEditorState] = useState(null);
    const [gridWidth, setGridWidth] = useState(window.innerWidth);

    const cols = 12;
    const rowHeight = 60;
    const gridMargin = [12, 12];

    useEffect(() => {
        const handleResize = () => setGridWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const colWidth = useMemo(() => (
        (gridWidth - gridMargin[0] * (cols + 1)) / cols
    ), [gridWidth, gridMargin, cols]);

    const openEditor = (widget) => {
        setEditorState({
            key: widget.metric,
            type: widget.type,
            draft: {
                name: widget.title,
                color: widget.color,
                w: widget.w,
                h: widget.h,
                min: widget.min ?? null,
                max: widget.max ?? null,
                indicatorType: widget.indicatorType ?? defaultIndicatorFor(widget.type)
            }
        });
    };

    const closeEditor = () => setEditorState(null);

    const handleSave = () => {
        if (!editorState) return;
        const normalizedDraft = {
            ...editorState.draft,
            min: editorState.draft.min === "" || editorState.draft.min === null
                ? null
                : Number(editorState.draft.min),
            max: editorState.draft.max === "" || editorState.draft.max === null
                ? null
                : Number(editorState.draft.max)
        };
        setWidgetConfigs(prev => ({
            ...prev,
            [editorState.key]: {
                ...prev[editorState.key],
                ...normalizedDraft,
                hidden: false
            }
        }));
        closeEditor();
    };

    const handleDelete = () => {
        if (!editorState) return;
        setWidgetConfigs(prev => ({
            ...prev,
            [editorState.key]: {
                ...prev[editorState.key],
                hidden: true
            }
        }));
        closeEditor();
    };

    const handleResizeStop = (key, size) => {
        const nextW = Math.max(
            1,
            Math.round((size.width + gridMargin[0]) / (colWidth + gridMargin[0]))
        );
        const nextH = Math.max(
            1,
            Math.round((size.height + gridMargin[1]) / (rowHeight + gridMargin[1]))
        );

        setWidgetConfigs(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                w: nextW,
                h: nextH
            }
        }));
    };

    const widgets = useMemo(() => {
        if (!metrics) return [];

        return Object.entries(metrics).flatMap(([key, value], index) => {
            const type = detectWidgetType(value, key);
            const size = defaultSize(type);
            const config = widgetConfigs[key] ?? {};

            if (config.hidden) {
                return [];
            }

            return {
                i: key,
                metric: key,
                title: config.name ?? getLabel(key),
                color: config.color ?? defaultColorFor(type),
                value,
                type,
                w: config.w ?? size.w,
                h: config.h ?? size.h,
                min: config.min,
                max: config.max,
                indicatorType: config.indicatorType,
                x: (index % 6) * 2,
                y: Math.floor(index / 6) * 2
            };
        });
    }, [metrics, widgetConfigs]);

    return (
        <>
            <GridLayout
                cols={cols}
                rowHeight={rowHeight}
                margin={gridMargin}
                width={gridWidth}
                draggableHandle=".widget-header"
                isResizable={false}
                compactType={null}
                preventCollision={false}
            >
                {widgets.map(w => {
                    const widthPx = w.w * colWidth + (w.w - 1) * gridMargin[0];
                    const heightPx = w.h * rowHeight + (w.h - 1) * gridMargin[1];
                    return (
                        <div key={w.i} data-grid={w}>
                            <ResizableBox
                                width={widthPx}
                                height={heightPx}
                                minConstraints={[
                                    colWidth + gridMargin[0],
                                    rowHeight + gridMargin[1]
                                ]}
                                resizeHandles={["se"]}
                                handle={<span className="react-resizable-handle react-resizable-handle-se" />}
                                onResizeStop={(event, data) => handleResizeStop(w.i, data.size)}
                            >
                                <AutoWidget
                                    metric={w.metric}
                                    value={w.value}
                                    type={w.type}
                                    title={w.title}
                                    color={w.color}
                                    min={w.min}
                                    max={w.max}
                                    indicatorType={w.indicatorType}
                                    onDoubleClick={() => openEditor(w)}
                                />
                            </ResizableBox>
                        </div>
                    );
                })}
            </GridLayout>

            {editorState && (
                <div className="widget-editor-overlay" onClick={closeEditor}>
                    <div className="widget-editor" onClick={(event) => event.stopPropagation()}>
                        <h3>Widget bearbeiten</h3>
                        <div className="widget-editor-grid">
                            <label>
                                Name
                                <input
                                    type="text"
                                    value={editorState.draft.name}
                                    onChange={(event) => setEditorState(prev => ({
                                        ...prev,
                                        draft: { ...prev.draft, name: event.target.value }
                                    }))}
                                />
                            </label>
                            <label>
                                Farbe
                                <input
                                    type="color"
                                    value={editorState.draft.color}
                                    onChange={(event) => setEditorState(prev => ({
                                        ...prev,
                                        draft: { ...prev.draft, color: event.target.value }
                                    }))}
                                />
                            </label>
                            <label>
                                Breite (Spalten)
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={editorState.draft.w}
                                    onChange={(event) => setEditorState(prev => ({
                                        ...prev,
                                        draft: { ...prev.draft, w: Number(event.target.value) }
                                    }))}
                                />
                            </label>
                            <label>
                                Höhe (Zeilen)
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={editorState.draft.h}
                                    onChange={(event) => setEditorState(prev => ({
                                        ...prev,
                                        draft: { ...prev.draft, h: Number(event.target.value) }
                                    }))}
                                />
                            </label>
                            <label>
                                Minimum
                                <input
                                    type="number"
                                    value={editorState.draft.min ?? ""}
                                    onChange={(event) => setEditorState(prev => ({
                                        ...prev,
                                        draft: {
                                            ...prev.draft,
                                            min: event.target.value === "" ? null : Number(event.target.value)
                                        }
                                    }))}
                                />
                            </label>
                            <label>
                                Maximum
                                <input
                                    type="number"
                                    value={editorState.draft.max ?? ""}
                                    onChange={(event) => setEditorState(prev => ({
                                        ...prev,
                                        draft: {
                                            ...prev.draft,
                                            max: event.target.value === "" ? null : Number(event.target.value)
                                        }
                                    }))}
                                />
                            </label>
                            <label>
                                Indikator
                                <select
                                    value={editorState.draft.indicatorType}
                                    onChange={(event) => setEditorState(prev => ({
                                        ...prev,
                                        draft: { ...prev.draft, indicatorType: event.target.value }
                                    }))}
                                    disabled={editorState.type === "boolean"}
                                >
                                    <option value="bar">Balken</option>
                                    <option value="circle">Kreis</option>
                                    <option value="led">LED</option>
                                    {editorState.type === "temperature" && (
                                        <option value="thermo">Thermometer</option>
                                    )}
                                </select>
                            </label>
                        </div>
                        <div className="widget-editor-actions">
                            <button className="btn-secondary" type="button" onClick={closeEditor}>
                                Abbrechen
                            </button>
                            <button className="btn-danger" type="button" onClick={handleDelete}>
                                Widget löschen
                            </button>
                            <button className="btn-primary" type="button" onClick={handleSave}>
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
