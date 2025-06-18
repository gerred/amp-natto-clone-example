import * as Comlink from 'comlink';
export class WorkerClient {
    worker = null;
    api = null;
    async initialize(workerUrl) {
        this.worker = new Worker(workerUrl, { type: 'module' });
        this.api = Comlink.wrap(this.worker);
    }
    async executeWorkflow(workflow) {
        if (!this.api)
            throw new Error('Worker not initialized');
        return this.api.executeWorkflow(workflow);
    }
    async stopWorkflow(workflowId) {
        if (!this.api)
            throw new Error('Worker not initialized');
        return this.api.stopWorkflow(workflowId);
    }
    async getStatus() {
        if (!this.api)
            throw new Error('Worker not initialized');
        return this.api.getStatus();
    }
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.api = null;
        }
    }
}
