import { StreamManager } from '../core/StreamManager';
import { WidgetEngine } from '../core/WidgetEngine';
export class PerformanceBenchmarks {
    streamManager = new StreamManager();
    widgetEngine = new WidgetEngine();
    async runAllBenchmarks() {
        console.log('Starting Node Flow Widget Performance Benchmarks...');
        const suites = [];
        suites.push(await this.runStreamingBenchmarks());
        suites.push(await this.runWidgetRenderingBenchmarks());
        suites.push(await this.runDataProcessingBenchmarks());
        suites.push(await this.runMemoryBenchmarks());
        suites.push(await this.runConcurrencyBenchmarks());
        this.logSummary(suites);
        return suites;
    }
    // Streaming Performance Benchmarks
    async runStreamingBenchmarks() {
        const results = [];
        // High-frequency streaming test
        results.push(await this.benchmarkHighFrequencyStreaming());
        // Large dataset streaming test  
        results.push(await this.benchmarkLargeDatasetStreaming());
        // Multiple stream management test
        results.push(await this.benchmarkMultipleStreams());
        // Stream compression test
        results.push(await this.benchmarkStreamCompression());
        return this.createSuite('Streaming Performance', results);
    }
    async benchmarkHighFrequencyStreaming() {
        const streamId = 'high-frequency-test';
        const messageCount = 10000;
        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();
        try {
            this.streamManager.createStream(streamId, { bufferSize: messageCount });
            // Emit high-frequency data
            for (let i = 0; i < messageCount; i++) {
                this.streamManager.emit(streamId, {
                    timestamp: Date.now(),
                    value: Math.random() * 100,
                    sequenceId: i
                });
            }
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 100));
            const endTime = performance.now();
            const duration = endTime - startTime;
            const throughput = messageCount / (duration / 1000);
            const memoryUsed = this.getMemoryUsage() - startMemory;
            this.streamManager.removeStream(streamId);
            return {
                name: 'High Frequency Streaming (10k messages)',
                duration,
                throughput,
                memoryUsed,
                successful: true,
                details: { messageCount, avgLatency: duration / messageCount }
            };
        }
        catch (error) {
            return {
                name: 'High Frequency Streaming (10k messages)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    async benchmarkLargeDatasetStreaming() {
        const streamId = 'large-dataset-test';
        const recordCount = 100000;
        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();
        try {
            this.streamManager.createStream(streamId, { bufferSize: recordCount });
            // Create large records
            const batchSize = 1000;
            for (let batch = 0; batch < recordCount / batchSize; batch++) {
                const batchData = [];
                for (let i = 0; i < batchSize; i++) {
                    batchData.push({
                        timestamp: Date.now(),
                        value: {
                            id: batch * batchSize + i,
                            name: `Record ${batch * batchSize + i}`,
                            data: new Array(100).fill(0).map(() => Math.random()),
                            metadata: {
                                batch,
                                index: i,
                                size: 100
                            }
                        }
                    });
                }
                this.streamManager.emitBatch(streamId, batchData);
            }
            const endTime = performance.now();
            const duration = endTime - startTime;
            const throughput = recordCount / (duration / 1000);
            const memoryUsed = this.getMemoryUsage() - startMemory;
            this.streamManager.removeStream(streamId);
            return {
                name: 'Large Dataset Streaming (100k records)',
                duration,
                throughput,
                memoryUsed,
                successful: true,
                details: { recordCount, avgRecordSize: 100 }
            };
        }
        catch (error) {
            return {
                name: 'Large Dataset Streaming (100k records)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    async benchmarkMultipleStreams() {
        const streamCount = 100;
        const messagesPerStream = 1000;
        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();
        try {
            const streamIds = Array.from({ length: streamCount }, (_, i) => `stream-${i}`);
            // Create multiple streams
            streamIds.forEach(id => {
                this.streamManager.createStream(id, { bufferSize: messagesPerStream });
            });
            // Emit data to all streams simultaneously
            const promises = streamIds.map(streamId => {
                return new Promise(resolve => {
                    for (let i = 0; i < messagesPerStream; i++) {
                        this.streamManager.emit(streamId, {
                            timestamp: Date.now(),
                            value: Math.random() * 100,
                            sequenceId: i
                        });
                    }
                    resolve();
                });
            });
            await Promise.all(promises);
            const endTime = performance.now();
            const duration = endTime - startTime;
            const totalMessages = streamCount * messagesPerStream;
            const throughput = totalMessages / (duration / 1000);
            const memoryUsed = this.getMemoryUsage() - startMemory;
            // Cleanup
            streamIds.forEach(id => this.streamManager.removeStream(id));
            return {
                name: 'Multiple Streams (100 streams, 1k messages each)',
                duration,
                throughput,
                memoryUsed,
                successful: true,
                details: { streamCount, messagesPerStream, totalMessages }
            };
        }
        catch (error) {
            return {
                name: 'Multiple Streams (100 streams, 1k messages each)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    async benchmarkStreamCompression() {
        const streamId = 'compression-test';
        const messageCount = 50000;
        const compressionRatio = 0.5;
        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();
        try {
            this.streamManager.createStream(streamId, { bufferSize: messageCount });
            // Fill stream with data
            for (let i = 0; i < messageCount; i++) {
                this.streamManager.emit(streamId, {
                    timestamp: Date.now(),
                    value: Math.random() * 100,
                    sequenceId: i
                });
            }
            // Test compression
            const originalStream = this.streamManager.getStream(streamId);
            const compressedStream = this.streamManager.getCompressedStream(streamId, compressionRatio);
            let originalCount = 0;
            let compressedCount = 0;
            originalStream.subscribe(data => { originalCount = data.length; });
            compressedStream.subscribe(data => { compressedCount = data.length; });
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 100));
            const endTime = performance.now();
            const duration = endTime - startTime;
            const compressionEfficiency = (originalCount - compressedCount) / originalCount;
            const memoryUsed = this.getMemoryUsage() - startMemory;
            this.streamManager.removeStream(streamId);
            return {
                name: 'Stream Compression (50k messages, 50% ratio)',
                duration,
                throughput: messageCount / (duration / 1000),
                memoryUsed,
                successful: true,
                details: {
                    originalCount,
                    compressedCount,
                    compressionEfficiency,
                    targetRatio: compressionRatio
                }
            };
        }
        catch (error) {
            return {
                name: 'Stream Compression (50k messages, 50% ratio)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    // Widget Rendering Benchmarks
    async runWidgetRenderingBenchmarks() {
        const results = [];
        results.push(await this.benchmarkWidgetCreation());
        results.push(await this.benchmarkWidgetUpdates());
        results.push(await this.benchmarkWidgetDestruction());
        return this.createSuite('Widget Rendering Performance', results);
    }
    async benchmarkWidgetCreation() {
        const widgetCount = 1000;
        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();
        try {
            const widgets = [];
            for (let i = 0; i < widgetCount; i++) {
                const widget = this.widgetEngine.createWidget({
                    id: `widget-${i}`,
                    type: {
                        name: 'test',
                        version: '1.0.0',
                        renderer: { render: () => { }, update: () => { }, destroy: () => { } },
                        schema: { type: 'object' },
                        capabilities: {
                            interactive: false,
                            realtime: false,
                            resizable: false,
                            configurable: false,
                            exportable: false
                        }
                    },
                    nodeId: `node-${i}`,
                    config: { testValue: i }
                });
                widgets.push(widget);
            }
            const endTime = performance.now();
            const duration = endTime - startTime;
            const throughput = widgetCount / (duration / 1000);
            const memoryUsed = this.getMemoryUsage() - startMemory;
            // Cleanup
            widgets.forEach(widget => this.widgetEngine.destroyWidget(widget.id));
            return {
                name: 'Widget Creation (1000 widgets)',
                duration,
                throughput,
                memoryUsed,
                successful: true,
                details: { widgetCount, avgCreationTime: duration / widgetCount }
            };
        }
        catch (error) {
            return {
                name: 'Widget Creation (1000 widgets)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    async benchmarkWidgetUpdates() {
        const widgetCount = 100;
        const updatesPerWidget = 1000;
        const startMemory = this.getMemoryUsage();
        try {
            // Create widgets
            const widgets = [];
            for (let i = 0; i < widgetCount; i++) {
                const widget = this.widgetEngine.createWidget({
                    id: `widget-${i}`,
                    type: {
                        name: 'test',
                        version: '1.0.0',
                        renderer: { render: () => { }, update: () => { }, destroy: () => { } },
                        schema: { type: 'object' },
                        capabilities: {
                            interactive: false,
                            realtime: true,
                            resizable: false,
                            configurable: false,
                            exportable: false
                        }
                    },
                    nodeId: `node-${i}`,
                    config: { testValue: i }
                });
                widgets.push(widget);
            }
            const startTime = performance.now();
            // Perform updates
            for (let update = 0; update < updatesPerWidget; update++) {
                widgets.forEach(widget => {
                    this.widgetEngine.updateWidgetState(widget.id, {
                        data: { value: Math.random() * 100, updateIndex: update },
                        metadata: { created: Date.now(), modified: Date.now() }
                    });
                });
            }
            const endTime = performance.now();
            const duration = endTime - startTime;
            const totalUpdates = widgetCount * updatesPerWidget;
            const throughput = totalUpdates / (duration / 1000);
            const memoryUsed = this.getMemoryUsage() - startMemory;
            // Cleanup
            widgets.forEach(widget => this.widgetEngine.destroyWidget(widget.id));
            return {
                name: 'Widget Updates (100 widgets, 1000 updates each)',
                duration,
                throughput,
                memoryUsed,
                successful: true,
                details: { widgetCount, updatesPerWidget, totalUpdates }
            };
        }
        catch (error) {
            return {
                name: 'Widget Updates (100 widgets, 1000 updates each)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    async benchmarkWidgetDestruction() {
        const widgetCount = 1000;
        const startMemory = this.getMemoryUsage();
        try {
            // Create widgets
            const widgets = [];
            for (let i = 0; i < widgetCount; i++) {
                const widget = this.widgetEngine.createWidget({
                    id: `widget-${i}`,
                    type: {
                        name: 'test',
                        version: '1.0.0',
                        renderer: { render: () => { }, update: () => { }, destroy: () => { } },
                        schema: { type: 'object' },
                        capabilities: {
                            interactive: false,
                            realtime: false,
                            resizable: false,
                            configurable: false,
                            exportable: false
                        }
                    },
                    nodeId: `node-${i}`,
                    config: { testValue: i }
                });
                widgets.push(widget);
            }
            const startTime = performance.now();
            // Destroy widgets
            widgets.forEach(widget => this.widgetEngine.destroyWidget(widget.id));
            const endTime = performance.now();
            const duration = endTime - startTime;
            const throughput = widgetCount / (duration / 1000);
            const memoryUsed = this.getMemoryUsage() - startMemory;
            return {
                name: 'Widget Destruction (1000 widgets)',
                duration,
                throughput,
                memoryUsed,
                successful: true,
                details: { widgetCount, avgDestructionTime: duration / widgetCount }
            };
        }
        catch (error) {
            return {
                name: 'Widget Destruction (1000 widgets)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    // Data Processing Benchmarks
    async runDataProcessingBenchmarks() {
        const results = [];
        results.push(await this.benchmarkDataTransformation());
        results.push(await this.benchmarkDataAggregation());
        results.push(await this.benchmarkDataFiltering());
        return this.createSuite('Data Processing Performance', results);
    }
    async benchmarkDataTransformation() {
        const dataCount = 100000;
        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();
        try {
            const sourceData = Array.from({ length: dataCount }, (_, i) => ({
                timestamp: Date.now(),
                value: {
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    category: `category-${i % 10}`,
                    metadata: { index: i, batch: Math.floor(i / 1000) }
                }
            }));
            // Transform data
            const transformedData = sourceData.map(item => ({
                ...item,
                value: {
                    ...item.value,
                    normalized: {
                        x: item.value.x / 100,
                        y: item.value.y / 100
                    },
                    computed: item.value.x * item.value.y,
                    categoryHash: item.value.category.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0)
                }
            }));
            const endTime = performance.now();
            const duration = endTime - startTime;
            const throughput = dataCount / (duration / 1000);
            const memoryUsed = this.getMemoryUsage() - startMemory;
            return {
                name: 'Data Transformation (100k records)',
                duration,
                throughput,
                memoryUsed,
                successful: true,
                details: {
                    dataCount,
                    transformationComplexity: 'medium',
                    originalSize: JSON.stringify(sourceData[0]).length,
                    transformedSize: JSON.stringify(transformedData[0]).length
                }
            };
        }
        catch (error) {
            return {
                name: 'Data Transformation (100k records)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    async benchmarkDataAggregation() {
        const dataCount = 100000;
        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();
        try {
            const sourceData = Array.from({ length: dataCount }, (_, i) => ({
                timestamp: Date.now(),
                value: {
                    category: `category-${i % 10}`,
                    value: Math.random() * 100,
                    weight: Math.random()
                }
            }));
            // Aggregate by category
            const aggregations = sourceData.reduce((acc, item) => {
                const category = item.value.category;
                if (!acc[category]) {
                    acc[category] = {
                        count: 0,
                        sum: 0,
                        weightedSum: 0,
                        min: Infinity,
                        max: -Infinity,
                        values: []
                    };
                }
                acc[category].count++;
                acc[category].sum += item.value.value;
                acc[category].weightedSum += item.value.value * item.value.weight;
                acc[category].min = Math.min(acc[category].min, item.value.value);
                acc[category].max = Math.max(acc[category].max, item.value.value);
                acc[category].values.push(item.value.value);
                return acc;
            }, {});
            // Calculate final statistics
            Object.values(aggregations).forEach((agg) => {
                agg.average = agg.sum / agg.count;
                agg.weightedAverage = agg.weightedSum / agg.count;
                agg.values.sort((a, b) => a - b);
                agg.median = agg.values[Math.floor(agg.values.length / 2)];
            });
            const endTime = performance.now();
            const duration = endTime - startTime;
            const throughput = dataCount / (duration / 1000);
            const memoryUsed = this.getMemoryUsage() - startMemory;
            return {
                name: 'Data Aggregation (100k records, 10 categories)',
                duration,
                throughput,
                memoryUsed,
                successful: true,
                details: {
                    dataCount,
                    categoryCount: Object.keys(aggregations).length,
                    aggregationTypes: ['count', 'sum', 'average', 'min', 'max', 'median', 'weightedAverage']
                }
            };
        }
        catch (error) {
            return {
                name: 'Data Aggregation (100k records, 10 categories)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    async benchmarkDataFiltering() {
        const dataCount = 100000;
        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();
        try {
            const sourceData = Array.from({ length: dataCount }, (_, i) => ({
                timestamp: Date.now(),
                value: {
                    id: i,
                    score: Math.random() * 100,
                    category: `category-${i % 10}`,
                    tags: [`tag-${i % 5}`, `tag-${(i + 1) % 5}`],
                    active: Math.random() > 0.3
                }
            }));
            // Apply multiple filters
            const filteredData = sourceData
                .filter(item => item.value.active)
                .filter(item => item.value.score > 50)
                .filter(item => item.value.category.includes('category-1') || item.value.category.includes('category-2'))
                .filter(item => item.value.tags.some(tag => tag.includes('tag-1')));
            const endTime = performance.now();
            const duration = endTime - startTime;
            const throughput = dataCount / (duration / 1000);
            const memoryUsed = this.getMemoryUsage() - startMemory;
            return {
                name: 'Data Filtering (100k records, 4 filters)',
                duration,
                throughput,
                memoryUsed,
                successful: true,
                details: {
                    originalCount: dataCount,
                    filteredCount: filteredData.length,
                    reductionRatio: (dataCount - filteredData.length) / dataCount,
                    filterCount: 4
                }
            };
        }
        catch (error) {
            return {
                name: 'Data Filtering (100k records, 4 filters)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    // Memory Benchmarks
    async runMemoryBenchmarks() {
        const results = [];
        results.push(await this.benchmarkMemoryUsage());
        results.push(await this.benchmarkGarbageCollection());
        return this.createSuite('Memory Performance', results);
    }
    async benchmarkMemoryUsage() {
        const iterations = 10000;
        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();
        try {
            const streamId = 'memory-test';
            this.streamManager.createStream(streamId, { bufferSize: iterations });
            for (let i = 0; i < iterations; i++) {
                // Create large objects to test memory management
                const largeObject = {
                    id: i,
                    data: new Array(1000).fill(0).map(() => Math.random()),
                    nested: {
                        level1: new Array(100).fill(0).map(() => ({ value: Math.random() })),
                        level2: {
                            data: new Array(100).fill(0).map(() => String(Math.random()))
                        }
                    }
                };
                this.streamManager.emit(streamId, {
                    timestamp: Date.now(),
                    value: largeObject,
                    sequenceId: i
                });
            }
            const peakMemory = this.getMemoryUsage();
            // Force cleanup
            this.streamManager.removeStream(streamId);
            if (global.gc) {
                global.gc();
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            const endMemory = this.getMemoryUsage();
            const endTime = performance.now();
            const duration = endTime - startTime;
            return {
                name: 'Memory Usage Test (10k large objects)',
                duration,
                throughput: iterations / (duration / 1000),
                memoryUsed: endMemory - startMemory,
                successful: true,
                details: {
                    startMemory,
                    peakMemory,
                    endMemory,
                    memoryLeak: endMemory - startMemory,
                    maxObjectSize: 1000 * 8 + 100 * 32 + 100 * 16 // Rough estimation
                }
            };
        }
        catch (error) {
            return {
                name: 'Memory Usage Test (10k large objects)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    async benchmarkGarbageCollection() {
        const cycles = 100;
        const objectsPerCycle = 1000;
        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();
        try {
            let totalCreated = 0;
            for (let cycle = 0; cycle < cycles; cycle++) {
                const objects = [];
                // Create objects
                for (let i = 0; i < objectsPerCycle; i++) {
                    objects.push({
                        id: totalCreated++,
                        data: new Array(100).fill(0).map(() => Math.random()),
                        timestamp: Date.now()
                    });
                }
                // Let objects go out of scope
                // (They should be garbage collected)
            }
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            const endTime = performance.now();
            const duration = endTime - startTime;
            const memoryUsed = this.getMemoryUsage() - startMemory;
            return {
                name: 'Garbage Collection Test (100 cycles, 1k objects each)',
                duration,
                throughput: totalCreated / (duration / 1000),
                memoryUsed,
                successful: true,
                details: {
                    cycles,
                    objectsPerCycle,
                    totalCreated,
                    memoryLeakPer1kObjects: memoryUsed / (totalCreated / 1000)
                }
            };
        }
        catch (error) {
            return {
                name: 'Garbage Collection Test (100 cycles, 1k objects each)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    // Concurrency Benchmarks
    async runConcurrencyBenchmarks() {
        const results = [];
        results.push(await this.benchmarkConcurrentStreams());
        results.push(await this.benchmarkConcurrentWidgets());
        return this.createSuite('Concurrency Performance', results);
    }
    async benchmarkConcurrentStreams() {
        const streamCount = 50;
        const messagesPerStream = 2000;
        const concurrentWorkers = 10;
        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();
        try {
            const streamIds = Array.from({ length: streamCount }, (_, i) => `concurrent-stream-${i}`);
            // Create streams
            streamIds.forEach(id => {
                this.streamManager.createStream(id, { bufferSize: messagesPerStream });
            });
            // Create concurrent workers
            const workers = Array.from({ length: concurrentWorkers }, async (_, workerIndex) => {
                const streamsPerWorker = Math.ceil(streamCount / concurrentWorkers);
                const startIndex = workerIndex * streamsPerWorker;
                const endIndex = Math.min(startIndex + streamsPerWorker, streamCount);
                for (let streamIndex = startIndex; streamIndex < endIndex; streamIndex++) {
                    const streamId = streamIds[streamIndex];
                    if (!streamId)
                        continue;
                    for (let msgIndex = 0; msgIndex < messagesPerStream; msgIndex++) {
                        this.streamManager.emit(streamId, {
                            timestamp: Date.now(),
                            value: {
                                workerIndex,
                                streamIndex,
                                msgIndex,
                                data: Math.random() * 100
                            },
                            sequenceId: msgIndex
                        });
                        // Yield control occasionally
                        if (msgIndex % 100 === 0) {
                            await new Promise(resolve => setTimeout(resolve, 0));
                        }
                    }
                }
            });
            await Promise.all(workers);
            const endTime = performance.now();
            const duration = endTime - startTime;
            const totalMessages = streamCount * messagesPerStream;
            const throughput = totalMessages / (duration / 1000);
            const memoryUsed = this.getMemoryUsage() - startMemory;
            // Cleanup
            streamIds.forEach(id => this.streamManager.removeStream(id));
            return {
                name: 'Concurrent Streams (50 streams, 2k messages each, 10 workers)',
                duration,
                throughput,
                memoryUsed,
                successful: true,
                details: {
                    streamCount,
                    messagesPerStream,
                    concurrentWorkers,
                    totalMessages,
                    avgMessagesPerWorker: totalMessages / concurrentWorkers
                }
            };
        }
        catch (error) {
            return {
                name: 'Concurrent Streams (50 streams, 2k messages each, 10 workers)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    async benchmarkConcurrentWidgets() {
        const widgetCount = 500;
        const updatesPerWidget = 100;
        const concurrentWorkers = 10;
        const startMemory = this.getMemoryUsage();
        const startTime = performance.now();
        try {
            // Create widgets
            const widgets = [];
            for (let i = 0; i < widgetCount; i++) {
                const widget = this.widgetEngine.createWidget({
                    id: `concurrent-widget-${i}`,
                    type: {
                        name: 'test',
                        version: '1.0.0',
                        renderer: { render: () => { }, update: () => { }, destroy: () => { } },
                        schema: { type: 'object' },
                        capabilities: {
                            interactive: false,
                            realtime: true,
                            resizable: false,
                            configurable: false,
                            exportable: false
                        }
                    },
                    nodeId: `node-${i}`,
                    config: { testValue: i }
                });
                widgets.push(widget);
            }
            // Create concurrent workers for updates
            const workers = Array.from({ length: concurrentWorkers }, async (_, workerIndex) => {
                const widgetsPerWorker = Math.ceil(widgetCount / concurrentWorkers);
                const startIndex = workerIndex * widgetsPerWorker;
                const endIndex = Math.min(startIndex + widgetsPerWorker, widgetCount);
                for (let updateIndex = 0; updateIndex < updatesPerWidget; updateIndex++) {
                    for (let widgetIndex = startIndex; widgetIndex < endIndex; widgetIndex++) {
                        const widget = widgets[widgetIndex];
                        if (!widget)
                            continue;
                        this.widgetEngine.updateWidgetState(widget.id, {
                            data: {
                                workerIndex,
                                updateIndex,
                                value: Math.random() * 100,
                                timestamp: Date.now()
                            }
                        });
                    }
                    // Yield control
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            });
            await Promise.all(workers);
            const endTime = performance.now();
            const duration = endTime - startTime;
            const totalUpdates = widgetCount * updatesPerWidget;
            const throughput = totalUpdates / (duration / 1000);
            const memoryUsed = this.getMemoryUsage() - startMemory;
            // Cleanup
            widgets.forEach(widget => this.widgetEngine.destroyWidget(widget.id));
            return {
                name: 'Concurrent Widget Updates (500 widgets, 100 updates each, 10 workers)',
                duration,
                throughput,
                memoryUsed,
                successful: true,
                details: {
                    widgetCount,
                    updatesPerWidget,
                    concurrentWorkers,
                    totalUpdates,
                    avgUpdatesPerWorker: totalUpdates / concurrentWorkers
                }
            };
        }
        catch (error) {
            return {
                name: 'Concurrent Widget Updates (500 widgets, 100 updates each, 10 workers)',
                duration: 0,
                throughput: 0,
                memoryUsed: 0,
                successful: false,
                details: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    // Utility methods
    getMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            return process.memoryUsage().heapUsed;
        }
        if ('memory' in performance) {
            return performance.memory.usedJSHeapSize || 0;
        }
        return 0; // Fallback for environments without memory info
    }
    createSuite(name, results) {
        const successfulResults = results.filter(r => r.successful);
        const averageThroughput = successfulResults.length > 0
            ? successfulResults.reduce((sum, r) => sum + r.throughput, 0) / successfulResults.length
            : 0;
        const totalMemoryUsed = results.reduce((sum, r) => sum + r.memoryUsed, 0);
        const successRate = results.length > 0 ? successfulResults.length / results.length : 0;
        return {
            name,
            results,
            averageThroughput,
            totalMemoryUsed,
            successRate
        };
    }
    logSummary(suites) {
        console.log('\n=== Node Flow Widget Performance Benchmark Results ===\n');
        suites.forEach(suite => {
            console.log(`📊 ${suite.name}`);
            console.log(`   Success Rate: ${(suite.successRate * 100).toFixed(1)}%`);
            console.log(`   Average Throughput: ${suite.averageThroughput.toFixed(0)} ops/sec`);
            console.log(`   Total Memory Used: ${(suite.totalMemoryUsed / 1024 / 1024).toFixed(2)} MB`);
            console.log('');
            suite.results.forEach(result => {
                const status = result.successful ? '✅' : '❌';
                console.log(`   ${status} ${result.name}`);
                if (result.successful) {
                    console.log(`      Duration: ${result.duration.toFixed(2)}ms`);
                    console.log(`      Throughput: ${result.throughput.toFixed(0)} ops/sec`);
                    console.log(`      Memory: ${(result.memoryUsed / 1024 / 1024).toFixed(2)} MB`);
                }
                else {
                    console.log(`      Error: ${result.details?.error || 'Unknown error'}`);
                }
                console.log('');
            });
        });
        // Overall summary
        const overallSuccess = suites.reduce((sum, s) => sum + s.successRate, 0) / suites.length;
        const overallThroughput = suites.reduce((sum, s) => sum + s.averageThroughput, 0) / suites.length;
        const overallMemory = suites.reduce((sum, s) => sum + s.totalMemoryUsed, 0);
        console.log('📈 Overall Performance Summary:');
        console.log(`   Overall Success Rate: ${(overallSuccess * 100).toFixed(1)}%`);
        console.log(`   Average Throughput: ${overallThroughput.toFixed(0)} ops/sec`);
        console.log(`   Total Memory Used: ${(overallMemory / 1024 / 1024).toFixed(2)} MB`);
        console.log('\n=== Benchmark Complete ===\n');
    }
}
// Export benchmark runner
export const benchmarks = new PerformanceBenchmarks();
// Quick benchmark run function
export async function runQuickBenchmarks() {
    console.log('Running quick performance benchmarks...');
    await benchmarks.runAllBenchmarks();
}
