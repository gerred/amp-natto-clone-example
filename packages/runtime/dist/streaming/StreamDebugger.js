import { Subject, BehaviorSubject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
export class StreamDebugger {
    streamEngine;
    snapshotSubject = new BehaviorSubject(null);
    alertSubject = new Subject();
    isRecording = false;
    snapshotInterval;
    eventHistory = [];
    maxHistorySize = 10000;
    snapshots$ = this.snapshotSubject.asObservable().pipe(shareReplay(1));
    alerts$ = this.alertSubject.asObservable().pipe(shareReplay(100));
    thresholds = {
        latency: { warning: 100, critical: 500 },
        errorRate: { warning: 0.05, critical: 0.15 },
        backpressure: { warning: 0.7, critical: 0.9 },
        memoryUsage: { warning: 0.8, critical: 0.95 }
    };
    constructor(streamEngine) {
        this.streamEngine = streamEngine;
        this.setupMonitoring();
    }
    startRecording() {
        if (this.isRecording)
            return;
        this.isRecording = true;
        this.startSnapshotCollection();
        console.info('Stream debugging started');
    }
    stopRecording() {
        if (!this.isRecording)
            return;
        this.isRecording = false;
        if (this.snapshotInterval) {
            clearInterval(this.snapshotInterval);
        }
        console.info('Stream debugging stopped');
    }
    getEventHistory() {
        return [...this.eventHistory];
    }
    getEventsForConnection(connectionId) {
        return this.eventHistory.filter(event => event.connectionId === connectionId);
    }
    getPerformanceReport() {
        const snapshot = this.snapshotSubject.value;
        const recentAlerts = this.getRecentAlerts(300000); // Last 5 minutes
        const topConnections = this.getTopConnections(10);
        return {
            overview: snapshot,
            recentAlerts,
            topConnections
        };
    }
    exportDebugData() {
        return {
            snapshots: [this.snapshotSubject.value].filter(Boolean),
            events: this.eventHistory,
            alerts: this.getRecentAlerts(86400000), // Last 24 hours
            metadata: {
                exportTimestamp: Date.now(),
                recordingDuration: this.isRecording ? Date.now() - (this.eventHistory[0]?.timestamp || 0) : 0,
                eventCount: this.eventHistory.length
            }
        };
    }
    clearHistory() {
        this.eventHistory = [];
        console.info('Debug history cleared');
    }
    setThresholds(thresholds) {
        this.thresholds = { ...this.thresholds, ...thresholds };
    }
    setupMonitoring() {
        // Monitor debug events
        this.streamEngine.debug$.subscribe(event => {
            this.recordEvent(event);
        });
        // Monitor metrics for alerts
        this.streamEngine.metrics$.subscribe(metricsMap => {
            this.checkForAlerts(metricsMap);
        });
    }
    recordEvent(event) {
        if (!this.isRecording)
            return;
        this.eventHistory.push(event);
        // Trim history if it gets too large
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
        }
    }
    startSnapshotCollection() {
        this.snapshotInterval = setInterval(() => {
            this.captureSnapshot();
        }, 1000); // Every second
    }
    captureSnapshot() {
        // Get current metrics
        let metricsMap;
        this.streamEngine.metrics$.subscribe(map => {
            metricsMap = map;
        }).unsubscribe();
        const connections = Array.from(metricsMap.entries()).map(([id, metrics]) => ({
            id,
            metrics,
            isActive: Date.now() - metrics.lastUpdated < 5000
        }));
        const systemMetrics = {
            totalConnections: connections.length,
            totalMessages: connections.reduce((sum, conn) => sum + conn.metrics.messagesPerSecond, 0),
            averageLatency: connections.length > 0
                ? connections.reduce((sum, conn) => sum + conn.metrics.averageLatency, 0) / connections.length
                : 0,
            systemLoad: this.calculateSystemLoad(connections)
        };
        const snapshot = {
            timestamp: Date.now(),
            connections,
            systemMetrics
        };
        this.snapshotSubject.next(snapshot);
    }
    checkForAlerts(metricsMap) {
        for (const [connectionId, metrics] of metricsMap) {
            // Check latency
            if (metrics.averageLatency > this.thresholds.latency.critical) {
                this.emitAlert('high_latency', 'critical', connectionId, `Critical latency: ${metrics.averageLatency.toFixed(1)}ms`, metrics.averageLatency, this.thresholds.latency.critical);
            }
            else if (metrics.averageLatency > this.thresholds.latency.warning) {
                this.emitAlert('high_latency', 'warning', connectionId, `High latency: ${metrics.averageLatency.toFixed(1)}ms`, metrics.averageLatency, this.thresholds.latency.warning);
            }
            // Check error rate
            if (metrics.errorRate > this.thresholds.errorRate.critical) {
                this.emitAlert('high_error_rate', 'critical', connectionId, `Critical error rate: ${(metrics.errorRate * 100).toFixed(1)}%`, metrics.errorRate, this.thresholds.errorRate.critical);
            }
            else if (metrics.errorRate > this.thresholds.errorRate.warning) {
                this.emitAlert('high_error_rate', 'warning', connectionId, `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`, metrics.errorRate, this.thresholds.errorRate.warning);
            }
            // Check backpressure
            if (metrics.bufferUtilization > this.thresholds.backpressure.critical) {
                this.emitAlert('backpressure', 'critical', connectionId, `Critical backpressure: ${(metrics.bufferUtilization * 100).toFixed(1)}%`, metrics.bufferUtilization, this.thresholds.backpressure.critical);
            }
            else if (metrics.bufferUtilization > this.thresholds.backpressure.warning) {
                this.emitAlert('backpressure', 'warning', connectionId, `High backpressure: ${(metrics.bufferUtilization * 100).toFixed(1)}%`, metrics.bufferUtilization, this.thresholds.backpressure.warning);
            }
        }
    }
    emitAlert(type, severity, connectionId, message, value, threshold) {
        const alert = {
            type,
            severity,
            connectionId,
            message,
            value,
            threshold,
            timestamp: Date.now()
        };
        this.alertSubject.next(alert);
    }
    calculateSystemLoad(connections) {
        if (connections.length === 0)
            return 0;
        const factors = {
            averageLatency: connections.reduce((sum, conn) => sum + conn.metrics.averageLatency, 0) / connections.length / 1000,
            averageBufferUtilization: connections.reduce((sum, conn) => sum + conn.metrics.bufferUtilization, 0) / connections.length,
            totalMessages: connections.reduce((sum, conn) => sum + conn.metrics.messagesPerSecond, 0) / 1000,
            errorRate: connections.reduce((sum, conn) => sum + conn.metrics.errorRate, 0) / connections.length
        };
        // Weighted combination of factors (normalized to 0-1)
        return Math.min(1, factors.averageLatency * 0.3 +
            factors.averageBufferUtilization * 0.4 +
            factors.totalMessages * 0.2 +
            factors.errorRate * 0.1);
    }
    getRecentAlerts(_timeWindow) {
        // In a real implementation, we'd maintain an alert history
        // For now, return empty array as alerts are emitted real-time
        return [];
    }
    getTopConnections(limit) {
        let metricsMap;
        this.streamEngine.metrics$.subscribe(map => {
            metricsMap = map;
        }).unsubscribe();
        return Array.from(metricsMap.entries())
            .map(([id, metrics]) => ({ id, metrics }))
            .sort((a, b) => b.metrics.messagesPerSecond - a.metrics.messagesPerSecond)
            .slice(0, limit);
    }
}
