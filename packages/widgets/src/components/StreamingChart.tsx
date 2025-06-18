import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartStream } from '../hooks/useStreamData';
import type { WidgetProps } from '../types';

interface StreamingChartProps extends WidgetProps {
  maxDataPoints?: number;
  updateInterval?: number;
  showMetrics?: boolean;
  lineColor?: string;
}

export function StreamingChart({ 
  id, 
  title = 'Streaming Chart',
  streamId,
  maxDataPoints = 100,
  updateInterval = 16,
  showMetrics = false,
  lineColor = '#8884d8',
  config 
}: StreamingChartProps) {
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
    if (error) return 'error';
    if (!isConnected) return 'disconnected';
    return 'connected';
  }, [isConnected, error]);

  const statusColor = {
    connected: '#4CAF50',
    disconnected: '#FF9800',
    error: '#F44336'
  }[connectionStatus];

  return (
    <div className="streaming-chart" style={{ 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      padding: '16px',
      backgroundColor: '#fff'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          {title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: statusColor
          }} />
          <span style={{ fontSize: '12px', color: '#666' }}>
            {connectionStatus}
          </span>
        </div>
      </div>

      {error ? (
        <div style={{ 
          color: '#F44336', 
          padding: '16px', 
          backgroundColor: '#FFEBEE',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          Error: {error.message}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              type="number"
              scale="linear"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => `X: ${value}`}
              formatter={(value: number) => [value.toFixed(2), 'Value']}
            />
            <Line 
              type="monotone" 
              dataKey="y" 
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false} // Disable animation for real-time data
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {showMetrics && (
        <div style={{ 
          marginTop: '12px', 
          padding: '8px',
          backgroundColor: '#F5F5F5',
          borderRadius: '4px',
          fontSize: '12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px'
        }}>
          <div>
            <strong>Messages:</strong> {metrics.messageCount}
          </div>
          <div>
            <strong>Latency:</strong> {metrics.averageLatency.toFixed(1)}ms
          </div>
          <div>
            <strong>Data Points:</strong> {chartData.length}
          </div>
        </div>
      )}
    </div>
  );
}
