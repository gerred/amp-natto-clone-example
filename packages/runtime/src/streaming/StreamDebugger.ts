import { Subject, BehaviorSubject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
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

export class StreamDebugger {
  private snapshotSubject = new BehaviorSubject<DebugSnapshot | null>(null);
  private alertSubject = new Subject<PerformanceAlert>();
  private isRecording = false;
  private snapshotInterval?: ReturnType<typeof setInterval>;
  private eventHistory: StreamDebugEvent[] = [];
  private maxHistorySize = 10000;

  public readonly snapshots$ = this.snapshotSubject.asObservable().pipe(shareReplay(1));
  public readonly alerts$ = this.alertSubject.asObservable().pipe(shareReplay(100));

  private thresholds = {
    latency: { warning: 100, critical: 500 },
    errorRate: { warning: 0.05, critical: 0.15 },
    backpressure: { warning: 0.7, critical: 0.9 },
    memoryUsage: { warning: 0.8, critical: 0.95 }
  };

  constructor(private streamEngine: StreamEngine) {
    this.setupMonitoring();
  }

  startRecording(): void {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.startSnapshotCollection();
    
    console.info('Stream debugging started');
  }

  stopRecording(): void {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    
    console.info('Stream debugging stopped');
  }

  getEventHistory(): StreamDebugEvent[] {
    return [...this.eventHistory];
  }

  getEventsForConnection(connectionId: string): StreamDebugEvent[] {
    return this.eventHistory.filter(event => event.connectionId === connectionId);
  }

  getPerformanceReport(): {
    overview: DebugSnapshot | null;
    recentAlerts: PerformanceAlert[];
    topConnections: Array<{ id: string; metrics: StreamMetrics }>;
  } {
    const snapshot = this.snapshotSubject.value;
    const recentAlerts = this.getRecentAlerts(300000); // Last 5 minutes
    const topConnections = this.getTopConnections(10);

    return {
      overview: snapshot,
      recentAlerts,
      topConnections
    };
  }

  exportDebugData(): {
    snapshots: DebugSnapshot[];
    events: StreamDebugEvent[];
    alerts: PerformanceAlert[];
    metadata: {
      exportTimestamp: number;
      recordingDuration: number;
      eventCount: number;
    };
  } {
    return {
      snapshots: [this.snapshotSubject.value].filter(Boolean) as DebugSnapshot[],
      events: this.eventHistory,
      alerts: this.getRecentAlerts(86400000), // Last 24 hours
      metadata: {
        exportTimestamp: Date.now(),
        recordingDuration: this.isRecording ? Date.now() - (this.eventHistory[0]?.timestamp || 0) : 0,
        eventCount: this.eventHistory.length
      }
    };
  }

  clearHistory(): void {
    this.eventHistory = [];
    console.info('Debug history cleared');
  }

  setThresholds(thresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  private setupMonitoring(): void {
    // Monitor debug events
    this.streamEngine.debug$.subscribe(event => {
      this.recordEvent(event);
    });

    // Monitor metrics for alerts
    this.streamEngine.metrics$.subscribe(metricsMap => {
      this.checkForAlerts(metricsMap);
    });
  }

  private recordEvent(event: StreamDebugEvent): void {
    if (!this.isRecording) return;

    this.eventHistory.push(event);
    
    // Trim history if it gets too large
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  private startSnapshotCollection(): void {
    this.snapshotInterval = setInterval(() => {
      this.captureSnapshot();
    }, 1000); // Every second
  }

  private captureSnapshot(): void {
    // Get current metrics
    let metricsMap: Map<string, StreamMetrics>;
    this.streamEngine.metrics$.subscribe(map => {
      metricsMap = map;
    }).unsubscribe();

    const connections = Array.from(metricsMap!.entries()).map(([id, metrics]) => ({
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

    const snapshot: DebugSnapshot = {
      timestamp: Date.now(),
      connections,
      systemMetrics
    };

    this.snapshotSubject.next(snapshot);
  }

  private checkForAlerts(metricsMap: Map<string, StreamMetrics>): void {
    for (const [connectionId, metrics] of metricsMap) {
      // Check latency
      if (metrics.averageLatency > this.thresholds.latency.critical) {
        this.emitAlert('high_latency', 'critical', connectionId, 
          `Critical latency: ${metrics.averageLatency.toFixed(1)}ms`, 
          metrics.averageLatency, this.thresholds.latency.critical);
      } else if (metrics.averageLatency > this.thresholds.latency.warning) {
        this.emitAlert('high_latency', 'warning', connectionId,
          `High latency: ${metrics.averageLatency.toFixed(1)}ms`,
          metrics.averageLatency, this.thresholds.latency.warning);
      }

      // Check error rate
      if (metrics.errorRate > this.thresholds.errorRate.critical) {
        this.emitAlert('high_error_rate', 'critical', connectionId,
          `Critical error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
          metrics.errorRate, this.thresholds.errorRate.critical);
      } else if (metrics.errorRate > this.thresholds.errorRate.warning) {
        this.emitAlert('high_error_rate', 'warning', connectionId,
          `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
          metrics.errorRate, this.thresholds.errorRate.warning);
      }

      // Check backpressure
      if (metrics.bufferUtilization > this.thresholds.backpressure.critical) {
        this.emitAlert('backpressure', 'critical', connectionId,
          `Critical backpressure: ${(metrics.bufferUtilization * 100).toFixed(1)}%`,
          metrics.bufferUtilization, this.thresholds.backpressure.critical);
      } else if (metrics.bufferUtilization > this.thresholds.backpressure.warning) {
        this.emitAlert('backpressure', 'warning', connectionId,
          `High backpressure: ${(metrics.bufferUtilization * 100).toFixed(1)}%`,
          metrics.bufferUtilization, this.thresholds.backpressure.warning);
      }
    }
  }

  private emitAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    connectionId: string,
    message: string,
    value: number,
    threshold: number
  ): void {
    const alert: PerformanceAlert = {
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

  private calculateSystemLoad(connections: Array<{ metrics: StreamMetrics }>): number {
    if (connections.length === 0) return 0;

    const factors = {
      averageLatency: connections.reduce((sum, conn) => sum + conn.metrics.averageLatency, 0) / connections.length / 1000,
      averageBufferUtilization: connections.reduce((sum, conn) => sum + conn.metrics.bufferUtilization, 0) / connections.length,
      totalMessages: connections.reduce((sum, conn) => sum + conn.metrics.messagesPerSecond, 0) / 1000,
      errorRate: connections.reduce((sum, conn) => sum + conn.metrics.errorRate, 0) / connections.length
    };

    // Weighted combination of factors (normalized to 0-1)
    return Math.min(1, 
      factors.averageLatency * 0.3 + 
      factors.averageBufferUtilization * 0.4 + 
      factors.totalMessages * 0.2 + 
      factors.errorRate * 0.1
    );
  }

  private getRecentAlerts(_timeWindow: number): PerformanceAlert[] {
    // In a real implementation, we'd maintain an alert history
    // For now, return empty array as alerts are emitted real-time
    return [];
  }

  private getTopConnections(limit: number): Array<{ id: string; metrics: StreamMetrics }> {
    let metricsMap: Map<string, StreamMetrics>;
    this.streamEngine.metrics$.subscribe(map => {
      metricsMap = map;
    }).unsubscribe();

    return Array.from(metricsMap!.entries())
      .map(([id, metrics]) => ({ id, metrics }))
      .sort((a, b) => b.metrics.messagesPerSecond - a.metrics.messagesPerSecond)
      .slice(0, limit);
  }
}
