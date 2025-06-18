import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useCallback, useRef, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { scaleLinear } from 'd3-scale';
import { extent, max, min } from 'd3-array';
import { WidgetContainer } from './WidgetContainer';
import { useWidgetStream } from '../../hooks/useWidgetStream';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
export const EnhancedChartWidget = ({ id, title, streamId, config = {}, chartConfig, realTimeUpdate = true, compressionRatio = 0.8, virtualizeThreshold = 1000, onEvent, ...props }) => {
    const chartRef = useRef(null);
    const { startMonitoring, stopMonitoring, metrics } = usePerformanceMonitor(id);
    // Stream data with performance optimizations
    const streamData = useWidgetStream(streamId, {
        throttle: realTimeUpdate ? 100 : 1000,
        maxBuffer: chartConfig?.maxDataPoints || 5000,
        compression: compressionRatio
    });
    // Transform stream data to chart format
    const chartData = useMemo(() => {
        const startTime = performance.now();
        if (!streamData || streamData.length === 0)
            return [];
        let processedData = streamData.map((item, index) => {
            const value = item.value;
            if (typeof value === 'object' && value !== null) {
                return {
                    index,
                    timestamp: item.timestamp,
                    ...value
                };
            }
            return {
                index,
                timestamp: item.timestamp,
                value: typeof value === 'number' ? value : 0,
                x: index,
                y: typeof value === 'number' ? value : 0
            };
        });
        // Apply compression for large datasets
        if (processedData.length > virtualizeThreshold) {
            const compressionStep = Math.floor(processedData.length / (virtualizeThreshold * compressionRatio));
            if (compressionStep > 1) {
                const compressed = [];
                for (let i = 0; i < processedData.length; i += compressionStep) {
                    compressed.push(processedData[i]);
                }
                // Always include the latest point
                if (compressed[compressed.length - 1] !== processedData[processedData.length - 1]) {
                    compressed.push(processedData[processedData.length - 1]);
                }
                processedData = compressed;
            }
        }
        // Record performance metrics
        const endTime = performance.now();
        // Note: Performance metrics are handled by the hook
        return processedData;
    }, [streamData, virtualizeThreshold, compressionRatio, metrics]);
    // Chart configuration with performance optimizations
    const chartOptions = useMemo(() => {
        const defaultConfig = {
            type: 'line',
            animation: false, // Disable for better performance
            grid: true,
            tooltip: true,
            legend: false,
            maxDataPoints: 5000,
            xAxis: {
                dataKey: 'index',
                type: 'number'
            },
            yAxis: {
                dataKey: 'value'
            },
            lines: [{
                    dataKey: 'value',
                    color: '#8884d8',
                    strokeWidth: 2,
                    dot: false
                }]
        };
        return { ...defaultConfig, ...chartConfig, ...config };
    }, [chartConfig, config]);
    // Auto-scale for better visualization
    const scales = useMemo(() => {
        if (chartData.length === 0)
            return null;
        const xValues = chartData.map(d => d.x || d.index);
        const yValues = chartData.map(d => d.y || d.value).filter(v => typeof v === 'number');
        const xDomain = extent(xValues);
        const yDomain = [min(yValues) || 0, max(yValues) || 100];
        return {
            x: scaleLinear().domain(xDomain).nice(),
            y: scaleLinear().domain(yDomain).nice()
        };
    }, [chartData]);
    // Event handlers
    const handleChartClick = useCallback((data, event) => {
        if (onEvent) {
            onEvent({
                type: 'click',
                source: { id },
                data: { chartData: data, event },
                timestamp: Date.now(),
                propagate: true
            });
        }
    }, [onEvent, id]);
    const handleDataPointHover = useCallback((data) => {
        if (onEvent) {
            onEvent({
                type: 'hover',
                source: { id },
                data: { hoveredData: data },
                timestamp: Date.now(),
                propagate: false
            });
        }
    }, [onEvent, id]);
    // Performance monitoring
    useEffect(() => {
        startMonitoring();
        return () => stopMonitoring();
    }, [startMonitoring, stopMonitoring]);
    // Render optimized chart
    const renderChart = () => {
        const { type, animation, grid, tooltip, legend } = chartOptions;
        const commonProps = {
            data: chartData,
            onClick: handleChartClick,
            onMouseMove: handleDataPointHover
        };
        const axisProps = {
            xAxis: (_jsx(XAxis, { dataKey: chartOptions.xAxis?.dataKey, type: chartOptions.xAxis?.type, domain: chartOptions.xAxis?.domain })),
            yAxis: (_jsx(YAxis, { domain: chartOptions.yAxis?.domain })),
            grid: grid ? _jsx(CartesianGrid, { strokeDasharray: "3 3" }) : null,
            tooltip: tooltip ? _jsx(Tooltip, {}) : null,
            legend: legend ? _jsx(Legend, {}) : null
        };
        switch (type) {
            case 'bar':
                return (_jsxs(BarChart, { ...commonProps, children: [axisProps.grid, axisProps.xAxis, axisProps.yAxis, axisProps.tooltip, axisProps.legend, chartOptions.lines?.map((line, index) => (_jsx(Bar, { dataKey: line.dataKey, fill: line.color, isAnimationActive: animation }, index)))] }));
            case 'scatter':
                return (_jsxs(ScatterChart, { ...commonProps, children: [axisProps.grid, axisProps.xAxis, axisProps.yAxis, axisProps.tooltip, axisProps.legend, chartOptions.lines?.map((line, index) => (_jsx(Scatter, { dataKey: line.dataKey, fill: line.color, isAnimationActive: animation }, index)))] }));
            case 'line':
            default:
                return (_jsxs(LineChart, { ...commonProps, children: [axisProps.grid, axisProps.xAxis, axisProps.yAxis, axisProps.tooltip, axisProps.legend, chartOptions.lines?.map((line, index) => (_jsx(Line, { type: "monotone", dataKey: line.dataKey, stroke: line.color, strokeWidth: line.strokeWidth, dot: line.dot, isAnimationActive: animation, connectNulls: false }, index)))] }));
        }
    };
    return (_jsx(WidgetContainer, { id: id, title: title || 'Enhanced Chart', toolbar: _jsxs("div", { className: "chart-toolbar", children: [_jsxs("span", { className: "data-points", children: [chartData.length, " points"] }), metrics && (_jsxs("span", { className: "performance-info", children: [metrics.fps?.toFixed(1), " fps"] }))] }), ...props, children: _jsx("div", { ref: chartRef, className: "enhanced-chart-container", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: renderChart() }) }) }));
};
export default EnhancedChartWidget;
