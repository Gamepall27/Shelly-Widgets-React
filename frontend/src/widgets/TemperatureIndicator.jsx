export default function TemperatureIndicator({ value = 0, min = 0, max = 100 }) {
    const range = max - min;
    const percent = range > 0 ? Math.min(Math.max((value - min) / range, 0), 1) * 100 : 0;

    return (
        <div className="thermo">
            <div
                className="thermo-fill"
                style={{ height: `${percent}%` }}
            />
        </div>
    );
}
