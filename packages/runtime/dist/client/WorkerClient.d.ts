import type { WorkflowDefinition } from '../types';
export interface WorkerAPI {
    executeWorkflow(workflow: WorkflowDefinition): Promise<void>;
    stopWorkflow(workflowId: string): Promise<void>;
    getStatus(): Promise<{
        running: string[];
    }>;
}
export declare class WorkerClient {
    private worker;
    private api;
    initialize(workerUrl: string): Promise<void>;
    executeWorkflow(workflow: WorkflowDefinition): Promise<void>;
    stopWorkflow(workflowId: string): Promise<void>;
    getStatus(): Promise<{
        running: string[];
    }>;
    terminate(): void;
}
