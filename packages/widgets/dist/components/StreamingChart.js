import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartStream } from '../hooks/useStreamData';
export function StreamingChart({ id, title = 'Streaming Chart', streamId, maxDataPoints = 100, updateInterval = 16, showMetrics = false, lineColor = '#8884d8', config }) {
    const { chartData, isConnected, error, metrics } = useChartStream(streamId || id, {
        maxDataPoints,
        updateInterval,
        enableBackpressure: true
    });
    const formattedData = useMemo(() => {
        return chartData.map((item, index) => ({
            x: typeof item.value === 'object' && 'x' in item.value ? item.value.x : index,
            y: typeof item.value === 'object' && 'y' in item.value ? item.value.y : Number(item.value),
            timestamp: item.timestamp
        }));
    }, [chartData]);
    const connectionStatus = useMemo(() => {
        if (error)
            return 'error';
        if (!isConnected)
            return 'disconnected';
        return 'connected';
    }, [isConnected, error]);
    const statusColor = {
        connected: '#4CAF50',
        disconnected: '#FF9800',
        error: '#F44336'
    }[connectionStatus];
    return (_jsxs("div", { className: "streaming-chart", style: {
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fff'
        }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }, children: [_jsx("h3", { style: { margin: 0, fontSize: '16px', fontWeight: 'bold' }, children: title }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("div", { style: {
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: statusColor
                                } }), _jsx("span", { style: { fontSize: '12px', color: '#666' }, children: connectionStatus })] })] }), error ? (_jsxs("div", { style: {
                    color: '#F44336',
                    padding: '16px',
                    backgroundColor: '#FFEBEE',
                    borderRadius: '4px',
                    fontSize: '14px'
                }, children: ["Error: ", error.message] })) : (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: formattedData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "x", type: "number", scale: "linear", domain: ['dataMin', 'dataMax'] }), _jsx(YAxis, {}), _jsx(Tooltip, { labelFormatter: (value) => `X: ${value}`, formatter: (value) => [value.toFixed(2), 'Value'] }), _jsx(Line, { type: "monotone", dataKey: "y", stroke: lineColor, strokeWidth: 2, dot: false, isAnimationActive: false })] }) })), showMetrics && (_jsxs("div", { style: {
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: '#F5F5F5',
                    borderRadius: '4px',
                    fontSize: '12px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px'
                }, children: [_jsxs("div", { children: [_jsx("strong", { children: "Messages:" }), " ", metrics.messageCount] }), _jsxs("div", { children: [_jsx("strong", { children: "Latency:" }), " ", metrics.averageLatency.toFixed(1), "ms"] }), _jsxs("div", { children: [_jsx("strong", { children: "Data Points:" }), " ", chartData.length] })] }))] }));
}
