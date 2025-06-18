import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { WidgetContainer } from './WidgetContainer';
import { useWidgetStream } from '../hooks/useWidgetStream';
import type { WidgetProps, ChartData } from '../types';

export function ChartWidget({ id, title, streamId }: WidgetProps) {
  const data = useWidgetStream<ChartData>(streamId);

  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      index,
      value: typeof item.value === 'number' ? item.value : item.value.y,
      timestamp: item.timestamp,
    }));
  }, [data]);

  return (
    <WidgetContainer id={id} title={title || 'Chart'}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </WidgetContainer>
  );
}
