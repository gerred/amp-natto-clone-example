import type { WorkflowDefinition, NodeDefinition, ExecutionContext, NodeExecutor } from '../types';
import { StreamEngine } from '../streaming/StreamEngine';
import { DefaultBackpressureHandler } from '../streaming/BackpressureHandler';
import { GracefulErrorRecovery } from '../streaming/ErrorRecovery';
import type { StreamMessage } from '../streaming/types';

export class WorkflowEngine {
  private nodeExecutors = new Map<string, NodeExecutor>();
  private runningWorkflows = new Map<string, AbortController>();
  private streamEngine: StreamEngine;
  private nodeDataStreams = new Map<string, Map<string, unknown>>();

  constructor() {
    this.streamEngine = new StreamEngine();
    this.streamEngine.setBackpressureHandler(new DefaultBackpressureHandler());
    this.streamEngine.setErrorRecovery(new GracefulErrorRecovery());
  }

  registerNodeExecutor(executor: NodeExecutor): void {
    this.nodeExecutors.set(executor.type, executor);
  }

  getStreamEngine(): StreamEngine {
    return this.streamEngine;
  }

  async executeWorkflow(workflow: WorkflowDefinition): Promise<void> {
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
        if (abortController.signal.aborted) break;

        const node = nodeMap.get(nodeId);
        if (!node) continue;

        await this.executeNode(workflow.id, node);
      }
    } finally {
      this.cleanupWorkflowStreams(workflow.id);
      this.runningWorkflows.delete(workflow.id);
    }
  }

  stopWorkflow(workflowId: string): void {
    const controller = this.runningWorkflows.get(workflowId);
    if (controller) {
      controller.abort();
    }
  }

  private async executeNode(workflowId: string, node: NodeDefinition): Promise<void> {
    const executor = this.nodeExecutors.get(node.type);
    if (!executor) {
      throw new Error(`No executor found for node type: ${node.type}`);
    }

    const nodeInputs = this.collectNodeInputs(workflowId, node.id);

    const context: ExecutionContext = {
      workflowId,
      nodeId: node.id,
      inputs: nodeInputs,
      config: node.config,
      emitOutput: (port: string, data: unknown) => {
        this.forwardDataToConnectedNodes(workflowId, node.id, port, data);
      },
      emitError: (error: Error) => {
        console.error(`Node ${node.id} error:`, error);
      },
    };

    await executor.execute(context);
  }

  private topologicalSort(workflow: WorkflowDefinition): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
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

  private setupWorkflowStreams(workflow: WorkflowDefinition): void {
    for (const edge of workflow.edges) {
      const connectionId = this.streamEngine.createConnection(
        edge.source,
        edge.target,
        edge.sourcePort,
        edge.targetPort,
        {
          bufferSize: 1000,
          batchTimeout: 16,
          maxBatchSize: 50,
          backpressureThreshold: 0.8,
          retryAttempts: 3,
          retryDelay: 100
        }
      );

      // Store connection info for cleanup
      if (!this.nodeDataStreams.has(workflow.id)) {
        this.nodeDataStreams.set(workflow.id, new Map());
      }
      this.nodeDataStreams.get(workflow.id)!.set(edge.id, connectionId);
    }
  }

  private cleanupWorkflowStreams(workflowId: string): void {
    const connections = this.nodeDataStreams.get(workflowId);
    if (connections) {
      for (const connectionId of connections.values()) {
        this.streamEngine.closeConnection(connectionId as string);
      }
      this.nodeDataStreams.delete(workflowId);
    }
  }

  private collectNodeInputs(_workflowId: string, _nodeId: string): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};
    
    // In a real implementation, this would collect data from connected input streams
    // For now, return empty inputs
    
    return inputs;
  }

  private async forwardDataToConnectedNodes(
    workflowId: string, 
    sourceNodeId: string, 
    port: string, 
    data: unknown
  ): Promise<void> {
    const connections = this.nodeDataStreams.get(workflowId);
    if (!connections) return;

    // Find edges that start from this node and port
    for (const [edgeId, connectionId] of connections) {
      const connection = this.streamEngine.getConnection(connectionId as string);
      if (!connection) continue;

      if (connection.sourceNodeId === sourceNodeId && connection.sourcePort === port) {
        const message: StreamMessage = {
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
        } catch (error) {
          console.error(`Failed to forward data from ${sourceNodeId}:${port}:`, error);
        }
      }
    }
  }

  destroy(): void {
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
