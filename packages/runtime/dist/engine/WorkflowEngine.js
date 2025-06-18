import { StreamEngine } from '../streaming/StreamEngine';
import { DefaultBackpressureHandler } from '../streaming/BackpressureHandler';
import { GracefulErrorRecovery } from '../streaming/ErrorRecovery';
export class WorkflowEngine {
    nodeExecutors = new Map();
    runningWorkflows = new Map();
    streamEngine;
    nodeDataStreams = new Map();
    constructor() {
        this.streamEngine = new StreamEngine();
        this.streamEngine.setBackpressureHandler(new DefaultBackpressureHandler());
        this.streamEngine.setErrorRecovery(new GracefulErrorRecovery());
    }
    registerNodeExecutor(executor) {
        this.nodeExecutors.set(executor.type, executor);
    }
    getStreamEngine() {
        return this.streamEngine;
    }
    async executeWorkflow(workflow) {
        const abortController = new AbortController();
        this.runningWorkflows.set(workflow.id, abortController);
        try {
            // Setup streaming connections for workflow edges
            this.setupWorkflowStreams(workflow);
            // Build execution graph
            const nodeMap = new Map(workflow.nodes.map((node) => [node.id, node]));
            const executionOrder = this.topologicalSort(workflow);
            // Execute nodes in order
            for (const nodeId of executionOrder) {
                if (abortController.signal.aborted)
                    break;
                const node = nodeMap.get(nodeId);
                if (!node)
                    continue;
                await this.executeNode(workflow.id, node);
            }
        }
        finally {
            this.cleanupWorkflowStreams(workflow.id);
            this.runningWorkflows.delete(workflow.id);
        }
    }
    stopWorkflow(workflowId) {
        const controller = this.runningWorkflows.get(workflowId);
        if (controller) {
            controller.abort();
        }
    }
    async executeNode(workflowId, node) {
        const executor = this.nodeExecutors.get(node.type);
        if (!executor) {
            throw new Error(`No executor found for node type: ${node.type}`);
        }
        const nodeInputs = this.collectNodeInputs(workflowId, node.id);
        const context = {
            workflowId,
            nodeId: node.id,
            inputs: nodeInputs,
            config: node.config,
            emitOutput: (port, data) => {
                this.forwardDataToConnectedNodes(workflowId, node.id, port, data);
            },
            emitError: (error) => {
                console.error(`Node ${node.id} error:`, error);
            },
        };
        await executor.execute(context);
    }
    topologicalSort(workflow) {
        const visited = new Set();
        const result = [];
        const visit = (nodeId) => {
            if (visited.has(nodeId))
                return;
            visited.add(nodeId);
            // Visit dependencies first
            const dependencies = workflow.edges
                .filter((edge) => edge.target === nodeId)
                .map((edge) => edge.source);
            for (const dep of dependencies) {
                visit(dep);
            }
            result.push(nodeId);
        };
        for (const node of workflow.nodes) {
            visit(node.id);
        }
        return result;
    }
    setupWorkflowStreams(workflow) {
        for (const edge of workflow.edges) {
            const connectionId = this.streamEngine.createConnection(edge.source, edge.target, edge.sourcePort, edge.targetPort, {
                bufferSize: 1000,
                batchTimeout: 16,
                maxBatchSize: 50,
                backpressureThreshold: 0.8,
                retryAttempts: 3,
                retryDelay: 100
            });
            // Store connection info for cleanup
            if (!this.nodeDataStreams.has(workflow.id)) {
                this.nodeDataStreams.set(workflow.id, new Map());
            }
            this.nodeDataStreams.get(workflow.id).set(edge.id, connectionId);
        }
    }
    cleanupWorkflowStreams(workflowId) {
        const connections = this.nodeDataStreams.get(workflowId);
        if (connections) {
            for (const connectionId of connections.values()) {
                this.streamEngine.closeConnection(connectionId);
            }
            this.nodeDataStreams.delete(workflowId);
        }
    }
    collectNodeInputs(_workflowId, _nodeId) {
        const inputs = {};
        // In a real implementation, this would collect data from connected input streams
        // For now, return empty inputs
        return inputs;
    }
    async forwardDataToConnectedNodes(workflowId, sourceNodeId, port, data) {
        const connections = this.nodeDataStreams.get(workflowId);
        if (!connections)
            return;
        // Find edges that start from this node and port
        for (const [edgeId, connectionId] of connections) {
            const connection = this.streamEngine.getConnection(connectionId);
            if (!connection)
                continue;
            if (connection.sourceNodeId === sourceNodeId && connection.sourcePort === port) {
                const message = {
                    id: `${sourceNodeId}-${Date.now()}-${Math.random()}`,
                    timestamp: Date.now(),
                    sourceNodeId,
                    targetNodeId: connection.targetNodeId,
                    port,
                    data,
                    metadata: { workflowId, edgeId }
                };
                try {
                    await connection.writer.write(message);
                }
                catch (error) {
                    console.error(`Failed to forward data from ${sourceNodeId}:${port}:`, error);
                }
            }
        }
    }
    destroy() {
        // Stop all running workflows
        for (const [workflowId, controller] of this.runningWorkflows) {
            controller.abort();
            this.cleanupWorkflowStreams(workflowId);
        }
        this.runningWorkflows.clear();
        // Destroy stream engine
        this.streamEngine.destroy();
    }
}
