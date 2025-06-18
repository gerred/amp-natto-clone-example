import * as Comlink from 'comlink';
import { WorkflowEngine } from '../engine/WorkflowEngine';
class WorkerAPI {
    engine = new WorkflowEngine();
    async executeWorkflow(workflow) {
        return this.engine.executeWorkflow(workflow);
    }
    async stopWorkflow(workflowId) {
        this.engine.stopWorkflow(workflowId);
    }
    async getStatus() {
        // TODO: Track running workflows
        return { running: [] };
    }
}
// Expose API to main thread
Comlink.expose(new WorkerAPI());
