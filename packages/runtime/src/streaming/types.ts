import type { Observable } from 'rxjs';

export interface StreamMessage<T = unknown> {
  id: string;
  timestamp: number;
  sourceNodeId: string;
  targetNodeId: string;
  port: string;
  data: T;
  metadata?: Record<string, unknown>;
}

export interface StreamConfig {
  bufferSize: number;
  batchTimeout: number;  // ms
  maxBatchSize: number;
  backpressureThreshold: number;
  retryAttempts: number;
  retryDelay: number;  // ms
}

export interface StreamMetrics {
  messagesPerSecond: number;
  averageLatency: number;
  bufferUtilization: number;
  backpressureEvents: number;
  errorRate: number;
  lastUpdated: number;
}

export interface StreamConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePort: string;
  targetPort: string;
  stream: ReadableStream<StreamMessage>;
  writer: WritableStreamDefaultWriter<StreamMessage>;
  metrics: StreamMetrics;
  config: StreamConfig;
}

export interface StreamBackpressureHandler {
  onBackpressure(connection: StreamConnection): Promise<void>;
  shouldDropMessage(message: StreamMessage): boolean;
  prioritizeMessage(message: StreamMessage): number;
}

export interface StreamErrorRecovery {
  onError(error: Error, connection: StreamConnection): Promise<void>;
  shouldRetry(error: Error, attempt: number): boolean;
  getRetryDelay(attempt: number): number;
}

export interface StreamMonitor {
  metrics$: Observable<Map<string, StreamMetrics>>;
  getMetrics(connectionId: string): StreamMetrics | undefined;
  resetMetrics(connectionId: string): void;
  onMessage(message: StreamMessage, connectionId: string): void;
  onError(error: Error, connectionId: string): void;
}

export interface BatchedMessage<T = unknown> {
  messages: StreamMessage<T>[];
  totalSize: number;
  timestamp: number;
}

export interface StreamDebugEvent {
  type: 'message' | 'backpressure' | 'error' | 'batch' | 'metrics';
  timestamp: number;
  connectionId: string;
  data: unknown;
}
