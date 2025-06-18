import type { WorkflowDefinition, NodeExecutor } from '../types';
import { StreamEngine } from '../streaming/StreamEngine';
export declare class WorkflowEngine {
    private nodeExecutors;
    private runningWorkflows;
    private streamEngine;
    private nodeDataStreams;
    constructor();
    registerNodeExecutor(executor: NodeExecutor): void;
    getStreamEngine(): StreamEngine;
    executeWorkflow(workflow: WorkflowDefinition): Promise<void>;
    stopWorkflow(workflowId: string): void;
    private executeNode;
    private topologicalSort;
    private setupWorkflowStreams;
    private cleanupWorkflowStreams;
    private collectNodeInputs;
    private forwardDataToConnectedNodes;
    destroy(): void;
}
