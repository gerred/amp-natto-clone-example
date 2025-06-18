import * as Comlink from 'comlink';
import type { WorkflowDefinition } from '../types';

export interface WorkerAPI {
  executeWorkflow(workflow: WorkflowDefinition): Promise<void>;
  stopWorkflow(workflowId: string): Promise<void>;
  getStatus(): Promise<{ running: string[] }>;
}

export class WorkerClient {
  private worker: Worker | null = null;
  private api: Comlink.Remote<WorkerAPI> | null = null;

  async initialize(workerUrl: string): Promise<void> {
    this.worker = new Worker(workerUrl, { type: 'module' });
    this.api = Comlink.wrap<WorkerAPI>(this.worker);
  }

  async executeWorkflow(workflow: WorkflowDefinition): Promise<void> {
    if (!this.api) throw new Error('Worker not initialized');
    return this.api.executeWorkflow(workflow);
  }

  async stopWorkflow(workflowId: string): Promise<void> {
    if (!this.api) throw new Error('Worker not initialized');
    return this.api.stopWorkflow(workflowId);
  }

  async getStatus(): Promise<{ running: string[] }> {
    if (!this.api) throw new Error('Worker not initialized');
    return this.api.getStatus();
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.api = null;
    }
  }
}
