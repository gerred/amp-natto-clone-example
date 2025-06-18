import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  StreamEngine, 
  StreamDebugger, 
  PerformanceTestSuite,
  DefaultBackpressureHandler,
  GracefulErrorRecovery,
  STANDARD_PERFORMANCE_TESTS
} from '../src/streaming';
import type { StreamMessage } from '../src/streaming/types';

describe('StreamEngine', () => {
  let streamEngine: StreamEngine;

  beforeEach(() => {
    streamEngine = new StreamEngine();
  });

  afterEach(() => {
    streamEngine.destroy();
  });

  describe('Connection Management', () => {
    it('should create and manage connections', () => {
      const connectionId = streamEngine.createConnection(
        'node1',
        'node2',
        'output',
        'input'
      );

      expect(connectionId).toBe('node1:output->node2:input');
      
      const connection = streamEngine.getConnection(connectionId);
      expect(connection).toBeDefined();
      expect(connection?.sourceNodeId).toBe('node1');
      expect(connection?.targetNodeId).toBe('node2');
    });

    it('should close connections properly', () => {
      const connectionId = streamEngine.createConnection('node1', 'node2', 'output', 'input');
      
      streamEngine.closeConnection(connectionId);
      
      const connection = streamEngine.getConnection(connectionId);
      expect(connection).toBeUndefined();
    });
  });

  describe('Message Processing', () => {
    it('should handle high-frequency messages without blocking', async () => {
      const connectionId = streamEngine.createConnection('node1', 'node2', 'output', 'input');
      const connection = streamEngine.getConnection(connectionId)!;
      
      const messageCount = 1000;
      const messages: StreamMessage[] = [];
      
      // Generate test messages
      for (let i = 0; i < messageCount; i++) {
        messages.push({
          id: `msg-${i}`,
          timestamp: Date.now(),
          sourceNodeId: 'node1',
          targetNodeId: 'node2',
          port: 'output',
          data: { value: i }
        });
      }

      // Send messages rapidly
      const startTime = Date.now();
      const writePromises = messages.map(msg => connection.writer.write(msg));
      await Promise.all(writePromises);
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(1000); // Should process 1000 messages in under 1 second
    });

    it('should create batched streams for UI updates', (done) => {
      const connectionId = streamEngine.createConnection('node1', 'node2', 'output', 'input');
      const connection = streamEngine.getConnection(connectionId)!;
      
      const batchedStream = streamEngine.createBatchedStream(connectionId, {
        batchTimeout: 50,
        maxBatchSize: 10
      });

      let batchReceived = false;
      batchedStream.subscribe({
        next: (batch) => {
          expect(batch.messages.length).toBeGreaterThan(0);
          expect(batch.totalSize).toBeGreaterThanOrEqual(batch.messages.length);
          expect(batch.timestamp).toBeGreaterThan(0);
          batchReceived = true;
          done();
        }
      });

      // Send test messages
      for (let i = 0; i < 5; i++) {
        connection.writer.write({
          id: `msg-${i}`,
          timestamp: Date.now(),
          sourceNodeId: 'node1',
          targetNodeId: 'node2',
          port: 'output',
          data: { value: i }
        });
      }
    });
  });

  describe('Metrics Collection', () => {
    it('should track connection metrics', async () => {
      const connectionId = streamEngine.createConnection('node1', 'node2', 'output', 'input');
      
      const initialMetrics = streamEngine.getMetrics(connectionId);
      expect(initialMetrics).toBeDefined();
      expect(initialMetrics?.messagesPerSecond).toBe(0);
      expect(initialMetrics?.averageLatency).toBe(0);

      // Send some messages to generate metrics
      const connection = streamEngine.getConnection(connectionId)!;
      for (let i = 0; i < 10; i++) {
        await connection.writer.write({
          id: `msg-${i}`,
          timestamp: Date.now() - 10, // Simulate some latency
          sourceNodeId: 'node1',
          targetNodeId: 'node2',
          port: 'output',
          data: { value: i }
        });
      }

      // Wait for metrics to update
      await new Promise(resolve => setTimeout(resolve, 100));

      const updatedMetrics = streamEngine.getMetrics(connectionId);
      expect(updatedMetrics?.averageLatency).toBeGreaterThan(0);
    });
  });
});

describe('BackpressureHandler', () => {
  it('should handle backpressure with message dropping', async () => {
    const handler = new DefaultBackpressureHandler({
      dropThreshold: 0.5,
      priorityDrop: true,
      maxWaitTime: 50
    });

    const lowPriorityMessage: StreamMessage = {
      id: 'low-priority',
      timestamp: Date.now(),
      sourceNodeId: 'node1',
      targetNodeId: 'node2',
      port: 'output',
      data: { value: 1 },
      metadata: { priority: 0.1 }
    };

    const highPriorityMessage: StreamMessage = {
      id: 'high-priority',
      timestamp: Date.now(),
      sourceNodeId: 'node1',
      targetNodeId: 'node2',
      port: 'output',
      data: { value: 2 },
      metadata: { priority: 0.9 }
    };

    const lowPriority = handler.prioritizeMessage(lowPriorityMessage);
    const highPriority = handler.prioritizeMessage(highPriorityMessage);

    expect(highPriority).toBeGreaterThan(lowPriority);
  });
});

describe('ErrorRecovery', () => {
  it('should implement retry logic with exponential backoff', () => {
    const recovery = new GracefulErrorRecovery();

    const retryableError = new Error('Network timeout');
    const nonRetryableError = new TypeError('Invalid type');

    expect(recovery.shouldRetry(retryableError, 0)).toBe(true);
    expect(recovery.shouldRetry(retryableError, 5)).toBe(true);
    expect(recovery.shouldRetry(nonRetryableError, 0)).toBe(false);

    const delay1 = recovery.getRetryDelay(0);
    const delay2 = recovery.getRetryDelay(1);
    const delay3 = recovery.getRetryDelay(2);

    expect(delay2).toBeGreaterThan(delay1);
    expect(delay3).toBeGreaterThan(delay2);
  });
});

describe('StreamDebugger', () => {
  let streamEngine: StreamEngine;
  let streamDebugger: StreamDebugger;

  beforeEach(() => {
    streamEngine = new StreamEngine();
    streamDebugger = new StreamDebugger(streamEngine);
  });

  afterEach(() => {
    streamDebugger.stopRecording();
    streamEngine.destroy();
  });

  it('should capture debug events and metrics', (done) => {
    streamDebugger.startRecording();

    // Listen for snapshots
    streamDebugger.snapshots$.subscribe(snapshot => {
      if (snapshot) {
        expect(snapshot.timestamp).toBeGreaterThan(0);
        expect(snapshot.systemMetrics).toBeDefined();
        done();
      }
    });

    // Create a connection to trigger events
    streamEngine.createConnection('node1', 'node2', 'output', 'input');
  });

  it('should generate performance alerts', (done) => {
    streamDebugger.startRecording();

    streamDebugger.alerts$.subscribe(alert => {
      expect(alert.type).toBeDefined();
      expect(alert.severity).toMatch(/warning|critical/);
      expect(alert.timestamp).toBeGreaterThan(0);
      done();
    });

    // This would trigger alerts in a real scenario with actual high latency
    // For testing, we'd need to mock the metrics
  });

  it('should export debug data', () => {
    streamDebugger.startRecording();
    
    const exportData = streamDebugger.exportDebugData();
    
    expect(exportData.metadata).toBeDefined();
    expect(exportData.metadata.exportTimestamp).toBeGreaterThan(0);
    expect(Array.isArray(exportData.events)).toBe(true);
    expect(Array.isArray(exportData.alerts)).toBe(true);
  });
});

describe('PerformanceTestSuite', () => {
  let streamEngine: StreamEngine;
  let testSuite: PerformanceTestSuite;

  beforeEach(() => {
    streamEngine = new StreamEngine();
    testSuite = new PerformanceTestSuite(streamEngine);
  });

  afterEach(() => {
    streamEngine.destroy();
  });

  it('should run basic performance test', async () => {
    const testConfig = {
      name: 'Basic Test',
      duration: 1000, // 1 second
      messageRate: 10,
      messageSize: 100,
      concurrentConnections: 1,
      dataPattern: 'sequential' as const
    };

    const result = await testSuite.runTest(testConfig);

    expect(result.config.name).toBe('Basic Test');
    expect(result.totalMessages).toBeGreaterThan(0);
    expect(result.avgMessagesPerSecond).toBeGreaterThan(0);
    expect(result.duration).toBeCloseTo(1000, -2); // Within 100ms of target
    expect(result.errorRate).toBe(0); // No errors expected
  }, 10000); // 10 second timeout

  it('should handle concurrent connections in performance test', async () => {
    const testConfig = {
      name: 'Concurrent Test',
      duration: 500, // 0.5 seconds
      messageRate: 20,
      messageSize: 50,
      concurrentConnections: 3,
      dataPattern: 'random' as const
    };

    const result = await testSuite.runTest(testConfig);

    expect(result.totalMessages).toBeGreaterThan(0);
    expect(result.avgMessagesPerSecond).toBeGreaterThan(0);
    // Should handle multiple connections without excessive errors
    expect(result.errorRate).toBeLessThan(0.1);
  }, 5000);

  it('should generate performance report', async () => {
    const testConfig = {
      name: 'Report Test',
      duration: 200,
      messageRate: 5,
      messageSize: 100,
      concurrentConnections: 1,
      dataPattern: 'sequential' as const
    };

    await testSuite.runTest(testConfig);
    const report = testSuite.generateReport();

    expect(report).toContain('Performance Test Report');
    expect(report).toContain('Report Test');
    expect(report).toContain('Total Messages');
    expect(report).toContain('Average Throughput');
  }, 5000);
});

describe('Integration Tests', () => {
  it('should handle complete streaming workflow', async () => {
    const streamEngine = new StreamEngine();
    const streamDebugger = new StreamDebugger(streamEngine);
    
    // Setup backpressure and error recovery
    streamEngine.setBackpressureHandler(new DefaultBackpressureHandler());
    streamEngine.setErrorRecovery(new GracefulErrorRecovery());
    
    streamDebugger.startRecording();

    try {
      // Create multiple connections
      const connections = [];
      for (let i = 0; i < 5; i++) {
        const connectionId = streamEngine.createConnection(
          `source-${i}`,
          `target-${i}`,
          'output',
          'input'
        );
        connections.push(connectionId);
      }

      // Send messages through all connections
      const messagePromises = [];
      for (let i = 0; i < connections.length; i++) {
        const connection = streamEngine.getConnection(connections[i])!;
        for (let j = 0; j < 10; j++) {
          messagePromises.push(
            connection.writer.write({
              id: `msg-${i}-${j}`,
              timestamp: Date.now(),
              sourceNodeId: `source-${i}`,
              targetNodeId: `target-${i}`,
              port: 'output',
              data: { value: j, connection: i }
            })
          );
        }
      }

      await Promise.all(messagePromises);

      // Verify metrics were collected
      for (const connectionId of connections) {
        const metrics = streamEngine.getMetrics(connectionId);
        expect(metrics).toBeDefined();
      }

      // Get debug report
      const debugData = streamDebugger.exportDebugData();
      expect(debugData.events.length).toBeGreaterThan(0);

    } finally {
      streamDebugger.stopRecording();
      streamEngine.destroy();
    }
  });
});
