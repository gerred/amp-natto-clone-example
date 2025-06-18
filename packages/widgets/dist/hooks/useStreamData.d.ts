import type { StreamData, ChartData, TableData, LogData } from '../types';
export interface StreamConfig {
    bufferSize?: number;
    updateInterval?: number;
    errorRetries?: number;
    enableBackpressure?: boolean;
}
export interface StreamState<T> {
    data: T[];
    isConnected: boolean;
    error: Error | null;
    metrics: {
        messageCount: number;
        averageLatency: number;
        lastUpdate: number;
    };
}
export declare function useStreamData<T extends StreamData>(streamId: string, config?: StreamConfig): StreamState<T>;
export declare function useChartStream(streamId: string, config?: StreamConfig & {
    maxDataPoints?: number;
}): StreamState<ChartData> & {
    chartData: ChartData[];
};
export declare function useTableStream(streamId: string, config?: StreamConfig & {
    pageSize?: number;
}): StreamState<TableData> & {
    tableData: TableData[];
    currentPage: number;
    totalPages: number;
    setPage: (page: number) => void;
};
export declare function useLogStream(streamId: string, config?: StreamConfig & {
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    maxLogs?: number;
}): StreamState<LogData> & {
    filteredLogs: LogData[];
    logLevels: Array<'debug' | 'info' | 'warn' | 'error'>;
    setLogLevel: (level: 'debug' | 'info' | 'warn' | 'error') => void;
};
export declare function useCombinedStreams<T extends StreamData>(streamIds: string[], config?: StreamConfig): {
    combinedData: Map<string, T[]>;
    isAllConnected: boolean;
    errors: Map<string, Error>;
    totalMetrics: {
        totalMessages: number;
        averageLatency: number;
        connectionCount: number;
    };
};
