import { WIDGET_TYPES } from "./widgets/registry";

export default function AddWidgetPanel({ metrics, onAdd }) {
    return (
        <div className="add-panel">
            <h3>Widget hinzufügen</h3>

            {Object.entries(metrics).map(([key]) =>
                Object.entries(WIDGET_TYPES).map(([type, def]) => (
                    <button
                        key={type + key}
                        onClick={() =>
                            onAdd({
                                type,
                                metric: key,
                                title: `${def.label} (${key})`
                            })
                        }
                    >
                        ➕ {def.label} → {key}
                    </button>
                ))
            )}
        </div>
    );
}
