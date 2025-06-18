export class DefaultBackpressureHandler {
    options;
    priorityWeights = new Map();
    constructor(options = {
        dropThreshold: 0.9,
        priorityDrop: true,
        maxWaitTime: 100
    }) {
        this.options = options;
    }
    setPriorityWeight(nodeType, weight) {
        this.priorityWeights.set(nodeType, weight);
    }
    async onBackpressure(connection) {
        const bufferUtilization = this.calculateBufferUtilization(connection);
        if (bufferUtilization > this.options.dropThreshold) {
            // Severe backpressure - start dropping messages
            console.warn(`Severe backpressure on connection ${connection.id}, buffer: ${bufferUtilization * 100}%`);
            // Wait a bit to see if pressure reduces
            await this.sleep(this.options.maxWaitTime);
        }
        else {
            // Moderate backpressure - slow down slightly
            await this.sleep(10);
        }
    }
    shouldDropMessage(message) {
        if (!this.options.priorityDrop) {
            return false;
        }
        // Drop messages based on priority
        const priority = this.prioritizeMessage(message);
        const dropProbability = Math.max(0, 1 - priority);
        return Math.random() < dropProbability;
    }
    prioritizeMessage(message) {
        // Higher number = higher priority (less likely to drop)
        const baseWeight = this.priorityWeights.get(message.sourceNodeId) || 0.5;
        // Consider message age (older messages get higher priority)
        const age = Date.now() - message.timestamp;
        const ageFactor = Math.min(1, age / 1000); // Max 1 second advantage
        // Consider metadata priority
        const metadataPriority = message.metadata?.priority || 0.5;
        return Math.min(1, baseWeight + ageFactor * 0.2 + metadataPriority * 0.3);
    }
    calculateBufferUtilization(connection) {
        return connection.metrics.bufferUtilization;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
export class AdaptiveBackpressureHandler {
    connectionStates = new Map();
    async onBackpressure(connection) {
        const state = this.getConnectionState(connection.id);
        const now = Date.now();
        const timeSinceLastBackpressure = now - state.lastBackpressure;
        // Adapt threshold based on frequency of backpressure
        if (timeSinceLastBackpressure < 1000) {
            // Frequent backpressure - lower threshold
            state.adaptiveThreshold = Math.max(0.5, state.adaptiveThreshold - 0.05);
            state.dropRate = Math.min(0.8, state.dropRate + 0.1);
        }
        else if (timeSinceLastBackpressure > 5000) {
            // Infrequent backpressure - raise threshold
            state.adaptiveThreshold = Math.min(0.9, state.adaptiveThreshold + 0.02);
            state.dropRate = Math.max(0.1, state.dropRate - 0.05);
        }
        state.lastBackpressure = now;
        // Apply adaptive waiting
        const waitTime = Math.min(200, 50 / state.adaptiveThreshold);
        await this.sleep(waitTime);
    }
    shouldDropMessage(message) {
        const connectionId = `${message.sourceNodeId}:${message.targetNodeId}`;
        const state = this.getConnectionState(connectionId);
        return Math.random() < state.dropRate;
    }
    prioritizeMessage(message) {
        // Simple priority based on message type and age
        const messageTypes = {
            'ui-update': 0.3,
            'data-flow': 0.7,
            'control': 0.9,
            'error': 1.0
        };
        const messageType = message.metadata?.type || 'data-flow';
        const basePriority = messageTypes[messageType] || 0.5;
        // Reduce priority for old messages
        const age = Date.now() - message.timestamp;
        const agePenalty = Math.min(0.5, age / 5000); // 5 second max penalty
        return Math.max(0, basePriority - agePenalty);
    }
    getConnectionState(connectionId) {
        if (!this.connectionStates.has(connectionId)) {
            this.connectionStates.set(connectionId, {
                lastBackpressure: 0,
                adaptiveThreshold: 0.8,
                dropRate: 0.1
            });
        }
        return this.connectionStates.get(connectionId);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
