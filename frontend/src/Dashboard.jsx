import { useEffect, useState } from "react";
import GridLayout from "react-grid-layout";
import { useShellyWs } from "./hooks/useShellyWs";
import AutoWidget from "./widgets/AutoWidget";
import WidgetConfigModal from "./components/WidgetConfigModal";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./styles/widgets.css";
import "./styles/modal.css";

/**
 * Saubere Anzeige-Namen
 */
function prettyName(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (s) => s.toUpperCase());
}

/**
 * Default-Konfiguration pro Typ
 */
function defaultConfig(key, value) {
  const k = key.toLowerCase();

  if (typeof value === "boolean") {
    return {
      indicator: "boolean",
      min: 0,
      max: 1,
      color: "#22c55e",
      w: 2,
      h: 2,
    };
  }

  if (k.includes("temp")) {
    return {
      indicator: "thermometer",
      min: 0,
      max: 100,
      color: "#f97316",
      w: 2,
      h: 3,
    };
  }

  if (k.includes("energy")) {
    return {
      indicator: "bar",
      min: 0,
      max: Math.max(1000, value || 1000),
      color: "#38bdf8",
      w: 3,
      h: 2,
    };
  }

  if (k.includes("power")) {
    return {
      indicator: "gauge",
      min: 0,
      max: Math.max(500, value || 500),
      color: "#facc15",
      w: 3,
      h: 2,
    };
  }

  return {
    indicator: "gauge",
    min: 0,
    max: Math.max(100, value || 100),
    color: "#22d3ee",
    w: 2,
    h: 2,
  };
}

export default function Dashboard() {
  const { state } = useShellyWs();
  const metrics = state?.metrics || {};

  const [widgets, setWidgets] = useState([]);
  const [layout, setLayout] = useState([]);
  const [editingWidget, setEditingWidget] = useState(null);

  /**
   * Automatisch Widgets erzeugen,
   * wenn neue Keys aus dem Backend kommen
   */
  useEffect(() => {
    const keys = Object.keys(metrics);

    // Widgets
    setWidgets((prev) => {
      const existingKeys = prev.map((w) => w.key);

      const newWidgets = keys
        .filter((k) => !existingKeys.includes(k))
        .map((k) => {
          const cfg = defaultConfig(k, metrics[k]);

          return {
            id: k, // stabiler Key → kein crypto
            key: k,
            title: prettyName(k),
            ...cfg,
          };
        });

      return [...prev, ...newWidgets];
    });

    // Layout
    setLayout((prev) => {
      const existing = prev.map((l) => l.i);

      const newLayouts = keys
        .filter((k) => !existing.includes(k))
        .map((k, i) => ({
          i: k,
          x: (i * 2) % 12,
          y: Infinity,
          w: defaultConfig(k, metrics[k]).w,
          h: defaultConfig(k, metrics[k]).h,
        }));

      return [...prev, ...newLayouts];
    });
  }, [metrics]);

  return (
    <div style={{ padding: 20 }}>
      <GridLayout
        layout={layout}
        cols={12}
        rowHeight={60}
        width={1200}
        margin={[12, 12]}
        draggableHandle=".widget-header"
        isResizable
        isDraggable
        onLayoutChange={setLayout}
        compactType={null}
        preventCollision={false}
      >
        {widgets.map((widget) => (
          <div
            key={widget.key}
            data-grid={layout.find((l) => l.i === widget.key)}
          >
            <AutoWidget
              widget={widget}
              value={metrics[widget.key]}
              onDoubleClick={() => setEditingWidget(widget)}
            />
          </div>
        ))}
      </GridLayout>

      {editingWidget && (
        <WidgetConfigModal
          widget={editingWidget}
          onSave={(updated) => {
            setWidgets((ws) =>
              ws.map((w) => (w.id === updated.id ? updated : w))
            );
            setEditingWidget(null);
          }}
          onClose={() => setEditingWidget(null)}
        />
      )}
    </div>
  );
}
