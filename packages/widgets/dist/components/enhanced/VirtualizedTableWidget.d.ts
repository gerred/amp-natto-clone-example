import React from 'react';
import { WidgetProps } from '../../core/types';
interface Column {
    key: string;
    title: string;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    sortable?: boolean;
    filterable?: boolean;
    resizable?: boolean;
    render?: (value: any, record: any, index: number) => React.ReactNode;
    formatter?: (value: any) => string;
}
interface TableConfig {
    columns: Column[];
    rowHeight?: number;
    headerHeight?: number;
    maxRows?: number;
    sortable?: boolean;
    filterable?: boolean;
    selectable?: boolean;
    multiSelect?: boolean;
    pagination?: {
        enabled: boolean;
        pageSize: number;
    };
    virtualScrolling?: {
        enabled: boolean;
        threshold: number;
    };
}
interface VirtualizedTableWidgetProps extends WidgetProps {
    tableConfig?: TableConfig;
    realTimeUpdate?: boolean;
    maxRows?: number;
}
export declare const VirtualizedTableWidget: React.FC<VirtualizedTableWidgetProps>;
export default VirtualizedTableWidget;
