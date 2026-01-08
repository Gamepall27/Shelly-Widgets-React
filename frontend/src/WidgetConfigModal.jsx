export default function WidgetConfigModal({
                                              metrics,
                                              onCreate,
                                              onClose
                                          }) {
    const metricKeys = Object.keys(metrics ?? {});

    const state = {
        type: "power",
        metric: metricKeys[0],
        title: "Neues Widget",
        color: "#4fd1c5",
        max: 100,
        w: 4,
        h: 3
    };

    return (
        <div className="modal">
            <h2>Widget konfigurieren</h2>

            <label>Titel</label>
            <input onChange={e => state.title = e.target.value} />

            <label>Typ</label>
            <select onChange={e => state.type = e.target.value}>
                <option value="power">Leistung</option>
                <option value="boolean">Boolean</option>
                <option value="text">Text</option>
                <option value="chart">Chart</option>
            </select>

            <label>Datenquelle</label>
            <select onChange={e => state.metric = e.target.value}>
                {metricKeys.map(k => (
                    <option key={k} value={k}>{k}</option>
                ))}
            </select>

            <label>Farbe</label>
            <input type="color" onChange={e => state.color = e.target.value} />

            <label>Max-Wert</label>
            <input type="number" defaultValue={100} onChange={e => state.max = Number(e.target.value)} />

            <label>Breite / Höhe</label>
            <div>
                <input type="number" defaultValue={4} onChange={e => state.w = Number(e.target.value)} />
                <input type="number" defaultValue={3} onChange={e => state.h = Number(e.target.value)} />
            </div>

            <div className="modal-actions">
                <button onClick={() => onCreate(state)}>Erstellen</button>
                <button onClick={onClose}>Abbrechen</button>
            </div>
        </div>
    );
}
