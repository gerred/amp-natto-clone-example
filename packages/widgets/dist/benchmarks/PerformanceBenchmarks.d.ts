interface BenchmarkResult {
    name: string;
    duration: number;
    throughput: number;
    memoryUsed: number;
    successful: boolean;
    details?: any;
}
interface BenchmarkSuite {
    name: string;
    results: BenchmarkResult[];
    averageThroughput: number;
    totalMemoryUsed: number;
    successRate: number;
}
export declare class PerformanceBenchmarks {
    private streamManager;
    private widgetEngine;
    runAllBenchmarks(): Promise<BenchmarkSuite[]>;
    private runStreamingBenchmarks;
    private benchmarkHighFrequencyStreaming;
    private benchmarkLargeDatasetStreaming;
    private benchmarkMultipleStreams;
    private benchmarkStreamCompression;
    private runWidgetRenderingBenchmarks;
    private benchmarkWidgetCreation;
    private benchmarkWidgetUpdates;
    private benchmarkWidgetDestruction;
    private runDataProcessingBenchmarks;
    private benchmarkDataTransformation;
    private benchmarkDataAggregation;
    private benchmarkDataFiltering;
    private runMemoryBenchmarks;
    private benchmarkMemoryUsage;
    private benchmarkGarbageCollection;
    private runConcurrencyBenchmarks;
    private benchmarkConcurrentStreams;
    private benchmarkConcurrentWidgets;
    private getMemoryUsage;
    private createSuite;
    private logSummary;
}
export declare const benchmarks: PerformanceBenchmarks;
export declare function runQuickBenchmarks(): Promise<void>;
export {};
