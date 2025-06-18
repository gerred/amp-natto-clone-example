import type { WidgetProps } from '../types';
interface StreamingLogsProps extends WidgetProps {
    maxLogs?: number;
    updateInterval?: number;
    showMetrics?: boolean;
    autoScroll?: boolean;
    defaultLogLevel?: 'debug' | 'info' | 'warn' | 'error';
}
export declare function StreamingLogs({ id, title, streamId, maxLogs, updateInterval, // Fast updates for logs
showMetrics, autoScroll, defaultLogLevel, config }: StreamingLogsProps): import("react/jsx-runtime").JSX.Element;
export {};
