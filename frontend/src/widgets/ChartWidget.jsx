import WidgetFrame from "./WidgetFrame";
import {
    LineChart, Line, XAxis, YAxis, Tooltip
} from "recharts";
import { useEffect, useState } from "react";

export default function ChartWidget({
                                        value,
                                        title,
                                        color,
                                        max,
                                        historySec = 300
                                    }) {
    const [data, setData] = useState([]);

    useEffect(() => {
        setData(d => [
            ...d.filter(p => Date.now() - p.ts < historySec * 1000),
            { ts: Date.now(), v: value }
        ]);
    }, [value, historySec]);

    return (
        <WidgetFrame title={title} icon="📈" color={color}>
            <LineChart width={260} height={140} data={data}>
                <XAxis hide dataKey="ts" />
                <YAxis domain={[0, max]} />
                <Tooltip />
                <Line
                    dataKey="v"
                    stroke={color}
                    dot={false}
                    strokeWidth={2}
                />
            </LineChart>
        </WidgetFrame>
    );
}
