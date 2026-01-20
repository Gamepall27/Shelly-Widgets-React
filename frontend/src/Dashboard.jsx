<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState } from "react";
=======
import { useMemo } from "react";
>>>>>>> parent of f27d16c (Doppelklick action und Widget editor hinzugefügt)
import GridLayout from "react-grid-layout";
import { useShellyWs } from "./hooks/useShellyWs";
import AutoWidget from "./widgets/AutoWidget";
import { detectWidgetType } from "./widgets/detectWidgetType";

<<<<<<< HEAD
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./styles/widgets.css";
import "./styles/modal.css";

function prettyName(key) {
  return String(key || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/:/g, " ")
    .replace(/\./g, " ")
    .replace(/^./, (s) => s.toUpperCase());
}

function defaultConfig(key, value) {
  const k = String(key || "").toLowerCase();

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
      max: Math.max(1000, Number(value) || 1000),
      color: "#38bdf8",
      w: 3,
      h: 2,
    };
  }

  if (k.includes("power") || k.includes("apower")) {
    return {
      indicator: "gauge",
      min: 0,
      max: Math.max(500, Number(value) || 500),
      color: "#facc15",
      w: 3,
      h: 2,
    };
  }

  if (k.includes("voltage")) {
    return {
      indicator: "gauge",
      min: 200,
      max: 260,
      color: "#60a5fa",
      w: 2,
      h: 2,
    };
  }

  if (k.includes("current")) {
    return {
      indicator: "gauge",
      min: 0,
      max: Math.max(10, Number(value) || 10),
      color: "#a78bfa",
      w: 2,
      h: 2,
    };
  }

  return {
    indicator: "gauge",
    min: 0,
    max: Math.max(100, Number(value) || 100),
    color: "#22d3ee",
    w: 2,
    h: 2,
  };
=======
function defaultSize(type) {
    switch (type) {
        case "temperature": return { w: 2, h: 3 };
        case "power": return { w: 3, h: 2 };
        case "energy": return { w: 3, h: 2 };
        case "boolean": return { w: 2, h: 2 };
        default: return { w: 2, h: 2 };
    }
>>>>>>> parent of f27d16c (Doppelklick action und Widget editor hinzugefügt)
}

function widgetId(deviceId, metricKey) {
  return `${deviceId}:${metricKey}`;
}

function useWindowWidth() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return w;
}

export default function Dashboard() {
<<<<<<< HEAD
  const { state } = useShellyWs();
  const devices = state?.devices || {};

  const windowWidth = useWindowWidth();

  // Flatten metrics
  const allMetricEntries = useMemo(() => {
    const out = [];
    for (const [devId, dev] of Object.entries(devices)) {
      const devName = dev?.name || devId;
      const metrics = dev?.metrics || {};
      for (const [k, v] of Object.entries(metrics)) {
        out.push({
          id: widgetId(devId, k),
          deviceId: devId,
          deviceName: devName,
          metricKey: k,
          value: v,
        });
      }
    }
    return out;
  }, [devices]);

  // Stabile Signatur: sortierte IDs als String
  const idsSignature = useMemo(() => {
    const ids = allMetricEntries.map((m) => m.id).sort();
    return ids.join("|");
  }, [allMetricEntries]);
=======
    const { metrics } = useShellyWs();
>>>>>>> parent of f27d16c (Doppelklick action und Widget editor hinzugefügt)

    const widgets = useMemo(() => {
        if (!metrics) return [];

<<<<<<< HEAD
  // Damit wir nicht auf JEDEM Render setState triggern
  const lastSigRef = useRef("");

  useEffect(() => {
    // Nur reagieren, wenn wirklich neue IDs dazugekommen sind
    if (idsSignature === lastSigRef.current) return;
    lastSigRef.current = idsSignature;

    const entriesById = new Map(allMetricEntries.map((m) => [m.id, m]));

    // Widgets ergänzen nur für neue IDs
    setWidgets((prev) => {
      const existing = new Set(prev.map((w) => w.id));
      let changed = false;

      const additions = [];
      for (const [id, m] of entriesById.entries()) {
        if (!existing.has(id)) {
          changed = true;
          const cfg = defaultConfig(m.metricKey, m.value);
          additions.push({
            id,
            deviceId: m.deviceId,
            metricKey: m.metricKey,
            title: `${m.deviceName} · ${prettyName(m.metricKey)}`,
            ...cfg,
          });
        }
      }

      return changed ? [...prev, ...additions] : prev;
    });

    // Layout ergänzen nur für neue IDs
    setLayout((prev) => {
      const existing = new Set(prev.map((l) => l.i));
      let changed = false;

      const additions = [];
      let i = 0;
      for (const id of entriesById.keys()) {
        if (!existing.has(id)) {
          changed = true;
          const m = entriesById.get(id);
          const cfg = defaultConfig(m?.metricKey || id, m?.value);

          additions.push({
            i: id,
            x: (i * 2) % 12,
            y: Infinity,
            w: cfg.w,
            h: cfg.h,
          });
          i += 1;
        }
      }

      return changed ? [...prev, ...additions] : prev;
    });
  }, [idsSignature, allMetricEntries]);

  const valueById = useMemo(() => {
    const map = {};
    for (const m of allMetricEntries) map[m.id] = m.value;
    return map;
  }, [allMetricEntries]);

  return (
    <div style={{ padding: 20 }}>
      <GridLayout
        layout={layout}
        cols={12}
        rowHeight={60}
        width={Math.max(320, windowWidth - 40)}
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
            key={widget.id}
            data-grid={layout.find((l) => l.i === widget.id)}
          >
            <AutoWidget
              widget={widget}
              value={valueById[widget.id]}
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
              ws.map((w) => (w.id === updated.id ? updated : w)),
            );

            setLayout((ls) =>
              ls.map((l) =>
                l.i === updated.id
                  ? { ...l, w: updated.w ?? l.w, h: updated.h ?? l.h }
                  : l,
              ),
            );

            setEditingWidget(null);
          }}
          onClose={() => setEditingWidget(null)}
        />
      )}
    </div>
  );
=======
        return Object.entries(metrics).map(([key, value], index) => {
            const type = detectWidgetType(value, key);
            const size = defaultSize(type);

            return {
                i: key,
                metric: key,
                value,
                type,
                ...size,
                x: (index % 6) * 2,
                y: Math.floor(index / 6) * 2
            };
        });
    }, [metrics]);

    return (
        <GridLayout
            cols={12}
            rowHeight={60}
            margin={[12, 12]}
            width={window.innerWidth}
            draggableHandle=".widget-header"
            isResizable
            compactType={null}
            preventCollision={false}
        >
            {widgets.map(w => (
                <div key={w.i} data-grid={w}>
                    <AutoWidget
                        metric={w.metric}
                        value={w.value}
                        type={w.type}
                    />
                </div>
            ))}
        </GridLayout>
    );
>>>>>>> parent of f27d16c (Doppelklick action und Widget editor hinzugefügt)
}
