import { Observable } from 'rxjs';
import { StreamData, StreamConfig, SubscriptionConfig } from './types';
export interface StreamMetrics {
    totalMessages: number;
    messagesPerSecond: number;
    averageLatency: number;
    bufferUtilization: number;
    connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
    lastMessageTime: number;
}
export declare class StreamManager {
    private streams;
    private streamConfigs;
    private subscriptions;
    private metrics;
    private destroyed$;
    getStream(streamId: string, config?: StreamConfig): Observable<StreamData[]>;
    createStream(streamId: string, config?: Partial<StreamConfig>): void;
    emit(streamId: string, data: StreamData): void;
    emitBatch(streamId: string, dataArray: StreamData[]): void;
    subscribe(streamId: string, config?: SubscriptionConfig): Observable<StreamData[]>;
    getWindowedStream(streamId: string, windowSizeMs: number): Observable<StreamData[]>;
    getAggregatedStream(streamId: string, aggregationFn: (data: StreamData[]) => any, windowMs?: number): Observable<any>;
    getStreamStats(streamId: string): Observable<{
        count: number;
        rate: number;
        latest: StreamData | null;
        min: number;
        max: number;
        avg: number;
    }>;
    getCompressedStream(streamId: string, compressionRatio?: number): Observable<StreamData[]>;
    getMetrics(streamId: string): StreamMetrics | undefined;
    getAllMetrics(): Map<string, StreamMetrics>;
    clearStream(streamId: string): void;
    removeStream(streamId: string): void;
    private updateMetrics;
    private setupMetricsMonitoring;
    destroy(): void;
}
export declare const streamManager: StreamManager;
export declare function createRealTimeStream<T>(streamId: string, source: Observable<T>, transform?: (data: T) => StreamData): Observable<StreamData[]>;
export declare function mergeStreams(streamIds: string[], targetStreamId: string): Observable<StreamData[]>;
