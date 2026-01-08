import { useState } from "react";
import GridLayout from "react-grid-layout";
import { WIDGET_TYPES } from "./widgets/registry";
import { useShellyWs } from "./hooks/useShellyWs";
import AddWidgetButton from "./AddWidgetButton";
import WidgetConfigModal from "./WidgetConfigModal";

export default function Dashboard() {
  const { metrics } = useShellyWs();
  const [widgets, setWidgets] = useState([]);
  const [adding, setAdding] = useState(false);

  return (
      <>
        <GridLayout cols={12} rowHeight={90} width={1200}>
          {widgets.map(w => {
            const Widget = WIDGET_TYPES[w.type].component;
            return (
                <div key={w.id} data-grid={w}>
                  <Widget {...w} value={metrics?.[w.metric]} />
                </div>
            );
          })}
        </GridLayout>

        <AddWidgetButton onClick={() => setAdding(true)} />

        {adding && (
            <WidgetConfigModal
                metrics={metrics}
                onCreate={cfg => {
                  setWidgets(w => [...w, {
                    ...cfg,
                    id: crypto.randomUUID(),
                    x: 0,
                    y: Infinity
                  }]);
                  setAdding(false);
                }}
                onClose={() => setAdding(false)}
            />
        )}
      </>
  );
}
