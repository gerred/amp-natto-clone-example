import React from 'react';
import { WidgetProps } from '../../core/types';
interface LogConfig {
    maxEntries?: number;
    autoScroll?: boolean;
    showTimestamp?: boolean;
    showLevel?: boolean;
    showSource?: boolean;
    dateFormat?: string;
    levelColors?: Record<string, string>;
    filters?: {
        levels?: string[];
        sources?: string[];
        keywords?: string[];
    };
    grouping?: {
        enabled: boolean;
        key: 'source' | 'level' | 'userId' | 'sessionId';
        maxGroups: number;
    };
    performance?: {
        virtualization: boolean;
        batchSize: number;
        updateInterval: number;
    };
}
interface StreamingLogWidgetProps extends WidgetProps {
    logConfig?: LogConfig;
    realTimeUpdate?: boolean;
    maxEntries?: number;
}
export declare const StreamingLogWidget: React.FC<StreamingLogWidgetProps>;
export default StreamingLogWidget;
