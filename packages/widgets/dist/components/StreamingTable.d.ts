import type { WidgetProps } from '../types';
interface StreamingTableProps extends WidgetProps {
    pageSize?: number;
    updateInterval?: number;
    showMetrics?: boolean;
    columns?: Array<{
        key: string;
        label: string;
        width?: string;
        formatter?: (value: unknown) => string;
    }>;
}
export declare function StreamingTable({ id, title, streamId, pageSize, updateInterval, // Slower updates for tables
showMetrics, columns, config }: StreamingTableProps): import("react/jsx-runtime").JSX.Element;
export {};
