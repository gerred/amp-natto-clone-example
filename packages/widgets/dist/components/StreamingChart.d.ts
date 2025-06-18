import type { WidgetProps } from '../types';
interface StreamingChartProps extends WidgetProps {
    maxDataPoints?: number;
    updateInterval?: number;
    showMetrics?: boolean;
    lineColor?: string;
}
export declare function StreamingChart({ id, title, streamId, maxDataPoints, updateInterval, showMetrics, lineColor, config }: StreamingChartProps): import("react/jsx-runtime").JSX.Element;
export {};
