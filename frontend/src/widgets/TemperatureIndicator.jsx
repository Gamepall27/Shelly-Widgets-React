export default function TemperatureIndicator({ value = 0, min = -10, max = 40 }) {
    const safeMax = max <= min ? min + 1 : max;
    const clamped = Math.min(Math.max(value, min), safeMax);
    const percent = ((clamped - min) / (safeMax - min)) * 100;

    return (
        <div className="thermo">
            <div
                className="thermo-fill"
                style={{ height: `${percent}%` }}
            />
        </div>
    );
}
