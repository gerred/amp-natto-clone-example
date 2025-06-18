import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from 'recharts';
import { WidgetContainer } from './WidgetContainer';
import { useWidgetStream } from '../hooks/useWidgetStream';
export function ChartWidget({ id, title, streamId }) {
    const data = useWidgetStream(streamId);
    const chartData = React.useMemo(() => {
        return data.map((item, index) => ({
            index,
            value: typeof item.value === 'number' ? item.value : item.value.y,
            timestamp: item.timestamp,
        }));
    }, [data]);
    return (_jsx(WidgetContainer, { id: id, title: title || 'Chart', children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "index" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "value", stroke: "#8884d8", strokeWidth: 2, dot: false, isAnimationActive: false })] }) }) }));
}
