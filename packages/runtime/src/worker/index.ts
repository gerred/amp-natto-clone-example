import * as Comlink from 'comlink';
import { WorkflowEngine } from '../engine/WorkflowEngine';
import type { WorkflowDefinition } from '../types';

class WorkerAPI {
  private engine = new WorkflowEngine();

  async executeWorkflow(workflow: WorkflowDefinition): Promise<void> {
    return this.engine.executeWorkflow(workflow);
  }

  async stopWorkflow(workflowId: string): Promise<void> {
    this.engine.stopWorkflow(workflowId);
  }

  async getStatus(): Promise<{ running: string[] }> {
    // TODO: Track running workflows
    return { running: [] };
  }
}

// Expose API to main thread
Comlink.expose(new WorkerAPI());
