import type { StreamEngine } from './StreamEngine';
export interface PerformanceTestConfig {
    name: string;
    duration: number;
    messageRate: number;
    messageSize: number;
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
export declare class PerformanceTestSuite {
    private streamEngine;
    private results;
    private isRunning;
    private abortController;
    constructor(streamEngine: StreamEngine);
    runTest(config: PerformanceTestConfig): Promise<PerformanceTestResult>;
    runTestSuite(configs: PerformanceTestConfig[]): Promise<PerformanceTestResult[]>;
    getResults(): PerformanceTestResult[];
    generateReport(): string;
    abort(): void;
    private setupTestConnections;
    private startMonitoring;
    private generateMessages;
    private generateMessage;
    private sendMessage;
    private calculateFinalMetrics;
    private formatTestResult;
    private generateSummary;
    private getMemoryUsage;
    private getCpuUsage;
    private sleep;
}
export declare const STANDARD_PERFORMANCE_TESTS: PerformanceTestConfig[];
