import { Subject, BehaviorSubject, timer } from 'rxjs';
import { buffer, map, filter, catchError, share, scan } from 'rxjs/operators';
const DEFAULT_STREAM_CONFIG = {
    bufferSize: 1000,
    batchTimeout: 16, // ~60fps
    maxBatchSize: 50,
    backpressureThreshold: 0.8,
    retryAttempts: 3,
    retryDelay: 100
};
export class StreamEngine {
    connections = new Map();
    messageSubject = new Subject();
    debugSubject = new Subject();
    metricsSubject = new BehaviorSubject(new Map());
    backpressureHandler;
    errorRecovery;
    metricsUpdateInterval;
    debug$ = this.debugSubject.asObservable().pipe(share());
    metrics$ = this.metricsSubject.asObservable().pipe(share());
    constructor() {
        this.startMetricsCollection();
    }
    setBackpressureHandler(handler) {
        this.backpressureHandler = handler;
    }
    setErrorRecovery(recovery) {
        this.errorRecovery = recovery;
    }
    createConnection(sourceNodeId, targetNodeId, sourcePort, targetPort, config = {}) {
        const connectionId = `${sourceNodeId}:${sourcePort}->${targetNodeId}:${targetPort}`;
        const fullConfig = { ...DEFAULT_STREAM_CONFIG, ...config };
        let controller;
        const stream = new ReadableStream({
            start(ctrl) {
                controller = ctrl;
            },
            cancel() {
                // Stream cancelled
            }
        }, {
            highWaterMark: fullConfig.bufferSize,
            size: () => 1
        });
        const writable = new WritableStream({
            write: async (message) => {
                try {
                    await this.processMessage(message, connectionId, controller);
                }
                catch (error) {
                    await this.handleError(error, connectionId);
                }
            },
            close() {
                controller?.close();
            },
            abort(reason) {
                controller?.error(reason);
            }
        }, {
            highWaterMark: fullConfig.bufferSize,
            size: () => 1
        });
        const writer = writable.getWriter();
        const connection = {
            id: connectionId,
            sourceNodeId,
            targetNodeId,
            sourcePort,
            targetPort,
            stream,
            writer,
            config: fullConfig,
            metrics: this.createInitialMetrics()
        };
        this.connections.set(connectionId, connection);
        this.debugEvent('message', connectionId, { action: 'connection_created' });
        return connectionId;
    }
    async processMessage(message, connectionId, controller) {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return;
        // Check backpressure
        const bufferUtilization = controller.desiredSize !== null
            ? (connection.config.bufferSize - controller.desiredSize) / connection.config.bufferSize
            : 0;
        if (bufferUtilization > connection.config.backpressureThreshold) {
            await this.handleBackpressure(connection);
            if (this.backpressureHandler?.shouldDropMessage(message)) {
                this.debugEvent('backpressure', connectionId, { action: 'message_dropped', messageId: message.id });
                return;
            }
        }
        // Enqueue message
        controller.enqueue(message);
        this.onMessage(message, connectionId);
        this.messageSubject.next({ message, connectionId });
    }
    async handleBackpressure(connection) {
        this.debugEvent('backpressure', connection.id, {
            bufferUtilization: connection.metrics.bufferUtilization
        });
        connection.metrics.backpressureEvents++;
        if (this.backpressureHandler) {
            await this.backpressureHandler.onBackpressure(connection);
        }
    }
    async handleError(error, connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return;
        this.onError(error, connectionId);
        this.debugEvent('error', connectionId, { error: error.message, stack: error.stack });
        if (this.errorRecovery) {
            await this.errorRecovery.onError(error, connection);
        }
    }
    getConnection(connectionId) {
        return this.connections.get(connectionId);
    }
    closeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return;
        connection.writer.close();
        this.connections.delete(connectionId);
        this.debugEvent('message', connectionId, { action: 'connection_closed' });
    }
    // Batching for UI updates
    createBatchedStream(connectionId, config) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            throw new Error(`Connection ${connectionId} not found`);
        }
        const batchConfig = { ...connection.config, ...config };
        return this.messageSubject.pipe(filter(({ connectionId: id }) => id === connectionId), map(({ message }) => message), buffer(timer(batchConfig.batchTimeout)), filter(messages => messages.length > 0), map(messages => {
            const batch = {
                messages: messages.slice(0, batchConfig.maxBatchSize),
                totalSize: messages.length,
                timestamp: Date.now()
            };
            this.debugEvent('batch', connectionId, {
                batchSize: batch.messages.length,
                totalMessages: batch.totalSize
            });
            return batch;
        }), catchError((streamError) => {
            this.handleError(streamError, connectionId);
            return [];
        }));
    }
    // Stream monitoring implementation
    onMessage(message, connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return;
        const now = Date.now();
        const latency = now - message.timestamp;
        connection.metrics.averageLatency =
            (connection.metrics.averageLatency * 0.9) + (latency * 0.1);
        connection.metrics.lastUpdated = now;
    }
    onError(_error, connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return;
        connection.metrics.errorRate =
            (connection.metrics.errorRate * 0.95) + 0.05;
        connection.metrics.lastUpdated = Date.now();
    }
    getMetrics(connectionId) {
        return this.connections.get(connectionId)?.metrics;
    }
    resetMetrics(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return;
        connection.metrics = this.createInitialMetrics();
        this.debugEvent('metrics', connectionId, { action: 'metrics_reset' });
    }
    createInitialMetrics() {
        return {
            messagesPerSecond: 0,
            averageLatency: 0,
            bufferUtilization: 0,
            backpressureEvents: 0,
            errorRate: 0,
            lastUpdated: Date.now()
        };
    }
    startMetricsCollection() {
        // Update metrics every second
        this.metricsUpdateInterval = setInterval(() => {
            this.updateMetrics();
        }, 1000);
        // Track message rates
        this.messageSubject.pipe(scan((acc, { connectionId }) => {
            acc.set(connectionId, (acc.get(connectionId) || 0) + 1);
            return acc;
        }, new Map())).subscribe(counts => {
            for (const [connectionId, count] of counts) {
                const connection = this.connections.get(connectionId);
                if (connection) {
                    connection.metrics.messagesPerSecond = count;
                }
            }
            counts.clear();
        });
    }
    updateMetrics() {
        const metricsMap = new Map();
        for (const [connectionId, connection] of this.connections) {
            metricsMap.set(connectionId, { ...connection.metrics });
        }
        this.metricsSubject.next(metricsMap);
    }
    debugEvent(type, connectionId, data) {
        this.debugSubject.next({
            type,
            timestamp: Date.now(),
            connectionId,
            data
        });
    }
    destroy() {
        if (this.metricsUpdateInterval) {
            clearInterval(this.metricsUpdateInterval);
        }
        for (const connectionId of this.connections.keys()) {
            this.closeConnection(connectionId);
        }
        this.messageSubject.complete();
        this.debugSubject.complete();
        this.metricsSubject.complete();
    }
}
