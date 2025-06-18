import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { scaleLinear } from 'd3-scale';
import { extent, max, min } from 'd3-array';
import { WidgetContainer } from './WidgetContainer';
import { useWidgetStream } from '../../hooks/useWidgetStream';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { WidgetProps, StreamData } from '../../core/types';

export interface ChartConfig {
  type: 'line' | 'bar' | 'scatter' | 'area';
  xAxis?: {
    dataKey: string;
    type?: 'number' | 'category' | 'time';
    domain?: [number | string, number | string];
  };
  yAxis?: {
    dataKey: string;
    domain?: [number, number];
  };
  lines?: Array<{
    dataKey: string;
    color?: string;
    strokeWidth?: number;
    dot?: boolean;
  }>;
  animation?: boolean;
  grid?: boolean;
  tooltip?: boolean;
  legend?: boolean;
  zoom?: boolean;
  brush?: boolean;
  maxDataPoints?: number;
}

interface ChartData {
  [key: string]: any;
  timestamp?: number;
  x?: number;
  y?: number;
}

interface EnhancedChartWidgetProps extends WidgetProps {
  chartConfig?: ChartConfig;
  realTimeUpdate?: boolean;
  compressionRatio?: number;
  virtualizeThreshold?: number;
}

export const EnhancedChartWidget: React.FC<EnhancedChartWidgetProps> = ({
  id,
  title,
  streamId,
  config = {},
  chartConfig,
  realTimeUpdate = true,
  compressionRatio = 0.8,
  virtualizeThreshold = 1000,
  onEvent,
  ...props
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { startMonitoring, stopMonitoring, metrics } = usePerformanceMonitor(id);
  
  // Stream data with performance optimizations
  const streamData = useWidgetStream<StreamData>(streamId, {
    throttle: realTimeUpdate ? 100 : 1000,
    maxBuffer: chartConfig?.maxDataPoints || 5000,
    compression: compressionRatio
  });

  // Transform stream data to chart format
  const chartData = useMemo(() => {
    if (!streamData || streamData.length === 0) return [];

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
        const compressed: ChartData[] = [];
        for (let i = 0; i < processedData.length; i += compressionStep) {
          const item = processedData[i];
          if (item) compressed.push(item);
        }
        // Always include the latest point
        const lastProcessed = processedData[processedData.length - 1];
        const lastCompressed = compressed[compressed.length - 1];
        if (lastCompressed && lastProcessed && lastCompressed !== lastProcessed) {
          compressed.push(lastProcessed);
        }
        processedData = compressed;
      }
    }

    // Performance metrics are handled by the hook

    return processedData;
  }, [streamData, virtualizeThreshold, compressionRatio, metrics]);

  // Chart configuration with performance optimizations
  const chartOptions = useMemo(() => {
    const defaultConfig: ChartConfig = {
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
    if (chartData.length === 0) return null;

    const xValues = chartData.map(d => d.x || d.index);
    const yValues = chartData.map(d => d.y || d.value).filter(v => typeof v === 'number');

    const xDomain = extent(xValues) as [number, number];
    const yDomain = [min(yValues) || 0, max(yValues) || 100];

    return {
      x: scaleLinear().domain(xDomain).nice(),
      y: scaleLinear().domain(yDomain).nice()
    };
  }, [chartData]);

  // Event handlers
  const handleChartClick = useCallback((data: any, event: any) => {
    if (onEvent) {
      onEvent({
        type: 'click' as any,
        source: { id } as any,
        data: { chartData: data, event },
        timestamp: Date.now(),
        propagate: true
      });
    }
  }, [onEvent, id]);

  const handleDataPointHover = useCallback((data: any) => {
    if (onEvent) {
      onEvent({
        type: 'hover' as any,
        source: { id } as any,
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
      xAxis: (
        <XAxis 
          dataKey={chartOptions.xAxis?.dataKey} 
          type={chartOptions.xAxis?.type}
          domain={chartOptions.xAxis?.domain}
        />
      ),
      yAxis: (
        <YAxis 
          domain={chartOptions.yAxis?.domain}
        />
      ),
      grid: grid ? <CartesianGrid strokeDasharray="3 3" /> : null,
      tooltip: tooltip ? <Tooltip /> : null,
      legend: legend ? <Legend /> : null
    };

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {axisProps.grid}
            {axisProps.xAxis}
            {axisProps.yAxis}
            {axisProps.tooltip}
            {axisProps.legend}
            {chartOptions.lines?.map((line, index) => (
              <Bar
                key={index}
                dataKey={line.dataKey}
                fill={line.color}
                isAnimationActive={animation}
              />
            ))}
          </BarChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {axisProps.grid}
            {axisProps.xAxis}
            {axisProps.yAxis}
            {axisProps.tooltip}
            {axisProps.legend}
            {chartOptions.lines?.map((line, index) => (
              <Scatter
                key={index}
                dataKey={line.dataKey}
                fill={line.color}
                isAnimationActive={animation}
              />
            ))}
          </ScatterChart>
        );

      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            {axisProps.grid}
            {axisProps.xAxis}
            {axisProps.yAxis}
            {axisProps.tooltip}
            {axisProps.legend}
            {chartOptions.lines?.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                dot={line.dot}
                isAnimationActive={animation}
                connectNulls={false}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <WidgetContainer
      id={id}
      title={title || 'Enhanced Chart'}
      toolbar={
        <div className="chart-toolbar">
          <span className="data-points">
            {chartData.length} points
          </span>
          {metrics && (
            <span className="performance-info">
              {metrics.fps?.toFixed(1)} fps
            </span>
          )}
        </div>
      }
      {...props}
    >
      <div ref={chartRef} className="enhanced-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </WidgetContainer>
  );
};

export default EnhancedChartWidget;
