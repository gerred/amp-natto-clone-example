import type { StreamEngine } from './StreamEngine';
import type { StreamMessage } from './types';

export interface PerformanceTestConfig {
  name: string;
  duration: number; // milliseconds
  messageRate: number; // messages per second
  messageSize: number; // bytes
  concurrentConnections: number;
  burstMode?: {
    enabled: boolean;
    burstSize: number;
    burstInterval: number;
  };
  dataPattern: 'sequential' | 'random' | 'sine-wave' | 'step';
}

export interface PerformanceTestResult {
  config: PerformanceTestConfig;
  startTime: number;
  endTime: number;
  duration: number;
  totalMessages: number;
  avgMessagesPerSecond: number;
  avgLatency: number;
  maxLatency: number;
  minLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorCount: number;
  errorRate: number;
  backpressureEvents: number;
  droppedMessages: number;
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
  };
  cpuUsage: number[];
  throughputSamples: number[];
  latencySamples: number[];
}

export class PerformanceTestSuite {
  private results: PerformanceTestResult[] = [];
  private isRunning = false;
  private abortController: AbortController | undefined;

  constructor(private streamEngine: StreamEngine) {}

  async runTest(config: PerformanceTestConfig): Promise<PerformanceTestResult> {
    if (this.isRunning) {
      throw new Error('Test already running');
    }

    console.log(`Starting performance test: ${config.name}`);
    this.isRunning = true;
    this.abortController = new AbortController();

    const result: Partial<PerformanceTestResult> = {
      config,
      startTime: Date.now(),
      totalMessages: 0,
      errorCount: 0,
      backpressureEvents: 0,
      droppedMessages: 0,
      memoryUsage: {
        initial: this.getMemoryUsage(),
        peak: 0,
        final: 0
      },
      cpuUsage: [],
      throughputSamples: [],
      latencySamples: []
    };

    try {
      // Setup connections
      const connections = this.setupTestConnections(config);
      
      // Start monitoring
      const monitoring = this.startMonitoring(result as PerformanceTestResult, connections);
      
      // Run message generation
      await this.generateMessages(config, connections, result as PerformanceTestResult);
      
      // Stop monitoring
      monitoring.stop();
      
      // Calculate final metrics
      this.calculateFinalMetrics(result as PerformanceTestResult);
      
      console.log(`Performance test completed: ${config.name}`);
      console.log(`Total messages: ${result.totalMessages}, Avg latency: ${result.avgLatency?.toFixed(2)}ms`);
      
      this.results.push(result as PerformanceTestResult);
      return result as PerformanceTestResult;
      
    } catch (error) {
      console.error(`Performance test failed: ${config.name}`, error);
      throw error;
    } finally {
      this.isRunning = false;
      this.abortController = undefined;
      result.endTime = Date.now();
      result.duration = result.endTime - (result.startTime || 0);
      if (result.memoryUsage) {
        result.memoryUsage.final = this.getMemoryUsage();
      }
    }
  }

  async runTestSuite(configs: PerformanceTestConfig[]): Promise<PerformanceTestResult[]> {
    const results: PerformanceTestResult[] = [];
    
    for (const config of configs) {
      const result = await this.runTest(config);
      results.push(result);
      
      // Cool down between tests
      await this.sleep(2000);
    }
    
    return results;
  }

  getResults(): PerformanceTestResult[] {
    return [...this.results];
  }

  generateReport(): string {
    if (this.results.length === 0) {
      return 'No test results available';
    }

    let report = '# Performance Test Report\n\n';
    
    for (const result of this.results) {
      report += this.formatTestResult(result);
      report += '\n---\n\n';
    }
    
    report += this.generateSummary();
    
    return report;
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private setupTestConnections(config: PerformanceTestConfig): string[] {
    const connections: string[] = [];
    
    for (let i = 0; i < config.concurrentConnections; i++) {
      const connectionId = this.streamEngine.createConnection(
        `source-${i}`,
        `target-${i}`,
        'output',
        'input',
        {
          bufferSize: 1000,
          batchTimeout: 16,
          maxBatchSize: 50,
          backpressureThreshold: 0.8,
          retryAttempts: 3,
          retryDelay: 100
        }
      );
      connections.push(connectionId);
    }
    
    return connections;
  }

  private startMonitoring(
    result: PerformanceTestResult, 
    connections: string[]
  ): { stop: () => void } {
    const monitoringInterval = setInterval(() => {
      // Update memory usage
      const currentMemory = this.getMemoryUsage();
      result.memoryUsage.peak = Math.max(result.memoryUsage.peak, currentMemory);
      
      // Sample CPU usage (mock implementation)
      result.cpuUsage.push(this.getCpuUsage());
      
      // Sample throughput and latency
      let totalThroughput = 0;
      let totalLatency = 0;
      let validConnections = 0;
      
      for (const connectionId of connections) {
        const metrics = this.streamEngine.getMetrics(connectionId);
        if (metrics) {
          totalThroughput += metrics.messagesPerSecond;
          totalLatency += metrics.averageLatency;
          result.backpressureEvents += metrics.backpressureEvents;
          validConnections++;
        }
      }
      
      if (validConnections > 0) {
        result.throughputSamples.push(totalThroughput);
        result.latencySamples.push(totalLatency / validConnections);
      }
    }, 100); // Sample every 100ms

    return {
      stop: () => clearInterval(monitoringInterval)
    };
  }

  private async generateMessages(
    config: PerformanceTestConfig,
    connections: string[],
    result: PerformanceTestResult
  ): Promise<void> {
    const messageInterval = 1000 / config.messageRate; // ms between messages
    const endTime = Date.now() + config.duration;
    let messageCounter = 0;

    while (Date.now() < endTime && !this.abortController?.signal.aborted) {
      const promises: Promise<void>[] = [];
      
      for (const connectionId of connections) {
        const connection = this.streamEngine.getConnection(connectionId);
        if (!connection) continue;

        const message = this.generateMessage(config, messageCounter++);
        
        promises.push(
          this.sendMessage(connection.writer, message)
            .then(() => {
              result.totalMessages++;
            })
            .catch(error => {
              result.errorCount++;
              console.warn(`Message send failed:`, error.message);
            })
        );
      }

      await Promise.allSettled(promises);
      
      // Handle burst mode
      if (config.burstMode?.enabled) {
        const burstCount = config.burstMode.burstSize;
        for (let i = 0; i < burstCount; i++) {
          const burstPromises = connections.map(connectionId => {
            const connection = this.streamEngine.getConnection(connectionId);
            if (!connection) return Promise.resolve();
            
            const message = this.generateMessage(config, messageCounter++);
            return this.sendMessage(connection.writer, message);
          });
          
          await Promise.allSettled(burstPromises);
        }
        
        await this.sleep(config.burstMode.burstInterval);
      } else {
        await this.sleep(messageInterval);
      }
    }
  }

  private generateMessage(config: PerformanceTestConfig, counter: number): StreamMessage {
    const timestamp = Date.now();
    
    let value: unknown;
    switch (config.dataPattern) {
      case 'sequential':
        value = counter;
        break;
      case 'random':
        value = Math.random() * 1000;
        break;
      case 'sine-wave':
        value = Math.sin(counter * 0.1) * 100;
        break;
      case 'step':
        value = Math.floor(counter / 10) * 10;
        break;
      default:
        value = counter;
    }

    // Pad message to reach target size
    const padding = 'x'.repeat(Math.max(0, config.messageSize - 100));

    return {
      id: `msg-${counter}`,
      timestamp,
      sourceNodeId: 'perf-test-source',
      targetNodeId: 'perf-test-target',
      port: 'output',
      data: { value, padding },
      metadata: { testMessage: true, counter }
    };
  }

  private async sendMessage(
    writer: WritableStreamDefaultWriter<StreamMessage>,
    message: StreamMessage
  ): Promise<void> {
    await writer.write(message);
  }

  private calculateFinalMetrics(result: PerformanceTestResult): void {
    result.avgMessagesPerSecond = result.totalMessages / (result.duration / 1000);
    result.errorRate = result.errorCount / result.totalMessages;
    
    if (result.latencySamples.length > 0) {
      result.avgLatency = result.latencySamples.reduce((a, b) => a + b, 0) / result.latencySamples.length;
      result.minLatency = Math.min(...result.latencySamples);
      result.maxLatency = Math.max(...result.latencySamples);
      
      const sortedLatencies = result.latencySamples.sort((a, b) => a - b);
      result.p95Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0;
      result.p99Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0;
    } else {
      result.avgLatency = 0;
      result.minLatency = 0;
      result.maxLatency = 0;
      result.p95Latency = 0;
      result.p99Latency = 0;
    }
  }

  private formatTestResult(result: PerformanceTestResult): string {
    return `## ${result.config.name}

**Configuration:**
- Duration: ${result.duration}ms
- Message Rate: ${result.config.messageRate}/s
- Concurrent Connections: ${result.config.concurrentConnections}
- Message Size: ${result.config.messageSize} bytes

**Results:**
- Total Messages: ${result.totalMessages}
- Average Throughput: ${result.avgMessagesPerSecond.toFixed(2)} msg/s
- Average Latency: ${result.avgLatency.toFixed(2)}ms
- P95 Latency: ${result.p95Latency.toFixed(2)}ms
- P99 Latency: ${result.p99Latency.toFixed(2)}ms
- Error Rate: ${(result.errorRate * 100).toFixed(2)}%
- Backpressure Events: ${result.backpressureEvents}
- Memory Usage: ${result.memoryUsage.initial.toFixed(1)}MB → ${result.memoryUsage.peak.toFixed(1)}MB → ${result.memoryUsage.final.toFixed(1)}MB
`;
  }

  private generateSummary(): string {
    const avgThroughput = this.results.reduce((sum, r) => sum + r.avgMessagesPerSecond, 0) / this.results.length;
    const avgLatency = this.results.reduce((sum, r) => sum + r.avgLatency, 0) / this.results.length;
    const avgErrorRate = this.results.reduce((sum, r) => sum + r.errorRate, 0) / this.results.length;

    return `## Summary

**Overall Performance:**
- Average Throughput: ${avgThroughput.toFixed(2)} msg/s
- Average Latency: ${avgLatency.toFixed(2)}ms
- Average Error Rate: ${(avgErrorRate * 100).toFixed(2)}%
- Tests Completed: ${this.results.length}
`;
  }

  private getMemoryUsage(): number {
    // Mock implementation - in browser, you might use performance.memory
    // In Node.js, you'd use process.memoryUsage()
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private getCpuUsage(): number {
    // Mock implementation - real implementation would measure CPU usage
    return Math.random() * 100;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Predefined test configurations
export const STANDARD_PERFORMANCE_TESTS: PerformanceTestConfig[] = [
  {
    name: 'Low Volume Baseline',
    duration: 30000, // 30 seconds
    messageRate: 10,
    messageSize: 100,
    concurrentConnections: 1,
    dataPattern: 'sequential'
  },
  {
    name: 'Medium Volume Test',
    duration: 60000, // 1 minute
    messageRate: 100,
    messageSize: 500,
    concurrentConnections: 5,
    dataPattern: 'random'
  },
  {
    name: 'High Volume Stress Test',
    duration: 120000, // 2 minutes
    messageRate: 1000,
    messageSize: 1000,
    concurrentConnections: 10,
    dataPattern: 'sine-wave'
  },
  {
    name: 'Burst Traffic Test',
    duration: 90000, // 1.5 minutes
    messageRate: 50,
    messageSize: 200,
    concurrentConnections: 3,
    burstMode: {
      enabled: true,
      burstSize: 100,
      burstInterval: 5000
    },
    dataPattern: 'step'
  },
  {
    name: 'Extreme Load Test',
    duration: 60000, // 1 minute
    messageRate: 2000,
    messageSize: 2000,
    concurrentConnections: 20,
    dataPattern: 'random'
  }
];
