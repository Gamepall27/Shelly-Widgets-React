export default function TemperatureIndicator({ value = 0 }) {
    const percent = Math.min(value / 100, 1) * 100;

    return (
        <div className="thermo">
            <div
                className="thermo-fill"
                style={{ height: `${percent}%` }}
            />
        </div>
    );
}
