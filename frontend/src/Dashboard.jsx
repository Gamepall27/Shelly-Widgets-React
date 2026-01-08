import { useMemo } from "react";
import GridLayout from "react-grid-layout";
import { useShellyWs } from "./hooks/useShellyWs";
import AutoWidget from "./widgets/AutoWidget";
import { detectWidgetType } from "./widgets/detectWidgetType";

function defaultSize(type) {
    switch (type) {
        case "temperature": return { w: 2, h: 3 };
        case "power": return { w: 3, h: 2 };
        case "energy": return { w: 3, h: 2 };
        case "boolean": return { w: 2, h: 2 };
        default: return { w: 2, h: 2 };
    }
}

export default function Dashboard() {
    const { metrics } = useShellyWs();

    const widgets = useMemo(() => {
        if (!metrics) return [];

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
}
