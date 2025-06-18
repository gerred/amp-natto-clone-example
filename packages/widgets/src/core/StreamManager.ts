import { BehaviorSubject, Observable, Subject, merge, interval } from 'rxjs';
import { 
  buffer, 
  bufferTime, 
  bufferCount, 
  debounceTime, 
  distinctUntilChanged, 
  filter, 
  map, 
  scan, 
  shareReplay, 
  switchMap, 
  takeUntil, 
  throttleTime,
  windowTime,
  mergeMap
} from 'rxjs/operators';
import { StreamData, StreamConfig, DataSubscription, SubscriptionConfig } from './types';

export interface StreamMetrics {
  totalMessages: number;
  messagesPerSecond: number;
  averageLatency: number;
  bufferUtilization: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastMessageTime: number;
}

export class StreamManager {
  private streams = new Map<string, BehaviorSubject<StreamData[]>>();
  private streamConfigs = new Map<string, StreamConfig>();
  private subscriptions = new Map<string, DataSubscription>();
  private metrics = new Map<string, StreamMetrics>();
  private destroyed$ = new Subject<void>();

  // Create or get existing stream
  getStream(streamId: string, config?: StreamConfig): Observable<StreamData[]> {
    if (!this.streams.has(streamId)) {
      this.createStream(streamId, config);
    }
    return this.streams.get(streamId)!.asObservable();
  }

  // Create new stream with configuration
  createStream(streamId: string, config?: Partial<StreamConfig>): void {
    const fullConfig: StreamConfig = { id: streamId, ...config };
    const bufferSize = fullConfig.bufferSize || 1000;
    const initialData: StreamData[] = [];
    
    const subject = new BehaviorSubject<StreamData[]>(initialData);
    this.streams.set(streamId, subject);
    this.streamConfigs.set(streamId, fullConfig);
    
    // Initialize metrics
    this.metrics.set(streamId, {
      totalMessages: 0,
      messagesPerSecond: 0,
      averageLatency: 0,
      bufferUtilization: 0,
      connectionStatus: 'connected',
      lastMessageTime: Date.now()
    });

    // Setup metrics monitoring
    this.setupMetricsMonitoring(streamId);
  }

  // Emit data to stream with automatic buffering
  emit(streamId: string, data: StreamData): void {
    const subject = this.streams.get(streamId);
    const config = this.streamConfigs.get(streamId);
    
    if (!subject || !config) {
      console.warn(`Stream ${streamId} not found`);
      return;
    }

    const currentData = subject.value;
    const bufferSize = config.bufferSize || 1000;
    
    // Add sequence ID if not present
    const processedData: StreamData = {
      ...data,
      sequenceId: data.sequenceId || currentData.length,
      timestamp: data.timestamp || Date.now()
    };

    // Maintain buffer size
    const newData = [...currentData, processedData];
    if (newData.length > bufferSize) {
      newData.splice(0, newData.length - bufferSize);
    }

    subject.next(newData);
    
    // Update metrics
    this.updateMetrics(streamId, processedData);
  }

  // Batch emit multiple data points
  emitBatch(streamId: string, dataArray: StreamData[]): void {
    const subject = this.streams.get(streamId);
    const config = this.streamConfigs.get(streamId);
    
    if (!subject || !config) return;

    const currentData = subject.value;
    const bufferSize = config.bufferSize || 1000;
    
    // Process all data points
    const processedData = dataArray.map((data, index) => ({
      ...data,
      sequenceId: data.sequenceId || (currentData.length + index),
      timestamp: data.timestamp || Date.now()
    }));

    // Merge with existing data and maintain buffer size
    const newData = [...currentData, ...processedData];
    if (newData.length > bufferSize) {
      newData.splice(0, newData.length - bufferSize);
    }

    subject.next(newData);
    
    // Update metrics for batch
    processedData.forEach(data => this.updateMetrics(streamId, data));
  }

  // Subscribe to stream with advanced configuration
  subscribe(streamId: string, config: SubscriptionConfig = {}): Observable<StreamData[]> {
    let stream = this.getStream(streamId);

    // Apply throttling
    if (config.throttle) {
      stream = stream.pipe(throttleTime(config.throttle));
    }

    // Apply debouncing
    if (config.debounce) {
      stream = stream.pipe(debounceTime(config.debounce));
    }

    // Apply buffering
    if (config.buffer) {
      stream = stream.pipe(
        switchMap(data => 
          new BehaviorSubject(data).pipe(
            bufferCount(config.buffer!),
            map(bufferedArrays => bufferedArrays.flat())
          )
        )
      );
    }

    return stream.pipe(
      distinctUntilChanged((prev, curr) => 
        prev.length === curr.length && 
        prev[prev.length - 1]?.sequenceId === curr[curr.length - 1]?.sequenceId
      ),
      shareReplay(1)
    );
  }

  // Get windowed data (sliding window)
  getWindowedStream(streamId: string, windowSizeMs: number): Observable<StreamData[]> {
    return this.getStream(streamId).pipe(
      map(data => {
        const cutoff = Date.now() - windowSizeMs;
        return data.filter(item => item.timestamp >= cutoff);
      })
    );
  }

  // Get aggregated data
  getAggregatedStream(
    streamId: string, 
    aggregationFn: (data: StreamData[]) => any,
    windowMs: number = 1000
  ): Observable<any> {
    return this.getWindowedStream(streamId, windowMs).pipe(
      map(data => aggregationFn(data)),
      distinctUntilChanged()
    );
  }

  // Real-time statistics
  getStreamStats(streamId: string): Observable<{
    count: number;
    rate: number;
    latest: StreamData | null;
    min: number;
    max: number;
    avg: number;
  }> {
    return this.getStream(streamId).pipe(
      map(data => {
        if (data.length === 0) {
          return { count: 0, rate: 0, latest: null, min: 0, max: 0, avg: 0 };
        }

        const values = data
          .map(item => typeof item.value === 'number' ? item.value : 0)
          .filter(val => typeof val === 'number');

        const now = Date.now();
        const recentData = data.filter(item => now - item.timestamp < 60000); // Last minute
        const rate = recentData.length / 60; // Per second

        return {
          count: data.length,
          rate,
          latest: data[data.length - 1],
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, val) => sum + val, 0) / values.length
        };
      })
    );
  }

  // Stream compression (for large datasets)
  getCompressedStream(streamId: string, compressionRatio: number = 0.5): Observable<StreamData[]> {
    return this.getStream(streamId).pipe(
      map(data => {
        if (data.length === 0) return data;
        
        const targetSize = Math.floor(data.length * compressionRatio);
        if (data.length <= targetSize) return data;

        // Simple compression: take every nth item plus latest
        const step = Math.floor(data.length / targetSize);
        const compressed: StreamData[] = [];
        
        for (let i = 0; i < data.length; i += step) {
          compressed.push(data[i]);
        }
        
        // Always include the latest data point
        if (compressed[compressed.length - 1] !== data[data.length - 1]) {
          compressed.push(data[data.length - 1]);
        }
        
        return compressed;
      })
    );
  }

  // Stream metrics
  getMetrics(streamId: string): StreamMetrics | undefined {
    return this.metrics.get(streamId);
  }

  getAllMetrics(): Map<string, StreamMetrics> {
    return new Map(this.metrics);
  }

  // Clear stream data
  clearStream(streamId: string): void {
    const subject = this.streams.get(streamId);
    if (subject) {
      subject.next([]);
    }
  }

  // Remove stream
  removeStream(streamId: string): void {
    const subject = this.streams.get(streamId);
    if (subject) {
      subject.complete();
      this.streams.delete(streamId);
      this.streamConfigs.delete(streamId);
      this.metrics.delete(streamId);
    }
  }

  // Private methods
  private updateMetrics(streamId: string, data: StreamData): void {
    const metrics = this.metrics.get(streamId);
    if (!metrics) return;

    const now = Date.now();
    const latency = now - data.timestamp;
    
    metrics.totalMessages++;
    metrics.lastMessageTime = now;
    metrics.averageLatency = (metrics.averageLatency + latency) / 2;
    
    // Calculate buffer utilization
    const currentData = this.streams.get(streamId)?.value || [];
    const config = this.streamConfigs.get(streamId);
    const bufferSize = config?.bufferSize || 1000;
    metrics.bufferUtilization = currentData.length / bufferSize;

    this.metrics.set(streamId, metrics);
  }

  private setupMetricsMonitoring(streamId: string): void {
    // Monitor messages per second
    interval(1000).pipe(
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      const metrics = this.metrics.get(streamId);
      if (!metrics) return;

      const now = Date.now();
      const data = this.streams.get(streamId)?.value || [];
      const recentMessages = data.filter(item => now - item.timestamp < 1000);
      
      metrics.messagesPerSecond = recentMessages.length;
      
      // Check connection status based on recent activity
      if (now - metrics.lastMessageTime > 5000) {
        metrics.connectionStatus = 'disconnected';
      } else if (now - metrics.lastMessageTime > 2000) {
        metrics.connectionStatus = 'connecting';
      } else {
        metrics.connectionStatus = 'connected';
      }

      this.metrics.set(streamId, metrics);
    });
  }

  destroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();

    // Complete all streams
    this.streams.forEach(subject => subject.complete());
    
    this.streams.clear();
    this.streamConfigs.clear();
    this.subscriptions.clear();
    this.metrics.clear();
  }
}

// Singleton instance
export const streamManager = new StreamManager();

// Helper functions for common streaming patterns
export function createRealTimeStream<T>(
  streamId: string,
  source: Observable<T>,
  transform?: (data: T) => StreamData
): Observable<StreamData[]> {
  const manager = streamManager;
  manager.createStream(streamId);

  source.subscribe(data => {
    const streamData = transform ? transform(data) : {
      timestamp: Date.now(),
      value: data,
      metadata: {}
    };
    manager.emit(streamId, streamData);
  });

  return manager.getStream(streamId);
}

export function mergeStreams(streamIds: string[], targetStreamId: string): Observable<StreamData[]> {
  const manager = streamManager;
  manager.createStream(targetStreamId);

  const sourceStreams = streamIds.map(id => manager.getStream(id));
  
  merge(...sourceStreams).pipe(
    mergeMap(dataArray => dataArray),
    buffer(interval(100)), // Batch updates every 100ms
    filter(batch => batch.length > 0)
  ).subscribe(batch => {
    manager.emitBatch(targetStreamId, batch);
  });

  return manager.getStream(targetStreamId);
}
