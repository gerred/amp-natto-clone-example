import React from 'react';
import { WidgetProps } from '../../core/types';
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
interface EnhancedChartWidgetProps extends WidgetProps {
    chartConfig?: ChartConfig;
    realTimeUpdate?: boolean;
    compressionRatio?: number;
    virtualizeThreshold?: number;
}
export declare const EnhancedChartWidget: React.FC<EnhancedChartWidgetProps>;
export default EnhancedChartWidget;
