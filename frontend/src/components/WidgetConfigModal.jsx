export default function WidgetConfigModal({ widget, onSave, onClose }) {
  const [cfg, setCfg] = useState({ ...widget });

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Widget konfigurieren</h2>

        <label>Name</label>
        <input
          value={cfg.title}
          onChange={(e) => setCfg({ ...cfg, title: e.target.value })}
        />

        <label>Farbe</label>
        <input
          type="color"
          value={cfg.color}
          onChange={(e) => setCfg({ ...cfg, color: e.target.value })}
        />

        <label>Indikator</label>
        <select
          value={cfg.indicator}
          onChange={(e) => setCfg({ ...cfg, indicator: e.target.value })}
        >
          <option value="gauge">Gauge</option>
          <option value="bar">Balken</option>
          <option value="thermometer">Thermometer</option>
          <option value="boolean">An/Aus</option>
        </select>

        <label>Min</label>
        <input
          type="number"
          value={cfg.min}
          onChange={(e) => setCfg({ ...cfg, min: +e.target.value })}
        />

        <label>Max</label>
        <input
          type="number"
          value={cfg.max}
          onChange={(e) => setCfg({ ...cfg, max: +e.target.value })}
        />

        <div className="modal-actions">
          <button onClick={() => onSave(cfg)}>Speichern</button>
          <button className="secondary" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
