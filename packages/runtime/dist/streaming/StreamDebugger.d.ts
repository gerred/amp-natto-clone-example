import type { StreamEngine } from './StreamEngine';
import type { StreamDebugEvent, StreamMetrics } from './types';
export interface DebugSnapshot {
    timestamp: number;
    connections: Array<{
        id: string;
        metrics: StreamMetrics;
        isActive: boolean;
    }>;
    systemMetrics: {
        totalConnections: number;
        totalMessages: number;
        averageLatency: number;
        systemLoad: number;
    };
}
export interface PerformanceAlert {
    type: 'high_latency' | 'high_error_rate' | 'backpressure' | 'memory_usage';
    severity: 'warning' | 'critical';
    connectionId: string;
    message: string;
    value: number;
    threshold: number;
    timestamp: number;
}
export declare class StreamDebugger {
    private streamEngine;
    private snapshotSubject;
    private alertSubject;
    private isRecording;
    private snapshotInterval?;
    private eventHistory;
    private maxHistorySize;
    readonly snapshots$: import("rxjs").Observable<DebugSnapshot | null>;
    readonly alerts$: import("rxjs").Observable<PerformanceAlert>;
    private thresholds;
    constructor(streamEngine: StreamEngine);
    startRecording(): void;
    stopRecording(): void;
    getEventHistory(): StreamDebugEvent[];
    getEventsForConnection(connectionId: string): StreamDebugEvent[];
    getPerformanceReport(): {
        overview: DebugSnapshot | null;
        recentAlerts: PerformanceAlert[];
        topConnections: Array<{
            id: string;
            metrics: StreamMetrics;
        }>;
    };
    exportDebugData(): {
        snapshots: DebugSnapshot[];
        events: StreamDebugEvent[];
        alerts: PerformanceAlert[];
        metadata: {
            exportTimestamp: number;
            recordingDuration: number;
            eventCount: number;
        };
    };
    clearHistory(): void;
    setThresholds(thresholds: Partial<typeof this.thresholds>): void;
    private setupMonitoring;
    private recordEvent;
    private startSnapshotCollection;
    private captureSnapshot;
    private checkForAlerts;
    private emitAlert;
    private calculateSystemLoad;
    private getRecentAlerts;
    private getTopConnections;
}
