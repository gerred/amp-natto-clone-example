import { vi, type MockedFunction } from 'vitest';
import type {
  ServiceWorkerAPI,
  Workflow,
  WorkflowExecution,
  BroadcastMessage,
} from '../types/index.js';

export interface MockServiceWorkerOptions {
  delayMs?: number;
  shouldFail?: boolean;
  failureRate?: number;
}

/**
 * Mock Service Worker API for testing
 */
export class MockServiceWorkerAPI implements ServiceWorkerAPI {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private options: MockServiceWorkerOptions;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(options: MockServiceWorkerOptions = {}) {
    this.options = {
      delayMs: 0,
      shouldFail: false,
      failureRate: 0,
      ...options,
    };
  }

  private async maybeDelay(): Promise<void> {
    if (this.options.delayMs! > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delayMs));
    }
  }

  private shouldSimulateFailure(): boolean {
    if (this.options.shouldFail) return true;
    if (this.options.failureRate! > 0) {
      return Math.random() < this.options.failureRate!;
    }
    return false;
  }

  async registerWorkflow(workflow: Workflow): Promise<void> {
    await this.maybeDelay();

    if (this.shouldSimulateFailure()) {
      throw new Error(`Mock failure: Failed to register workflow ${workflow.id}`);
    }

    this.workflows.set(workflow.id, workflow);
  }

  async unregisterWorkflow(workflowId: string): Promise<void> {
    await this.maybeDelay();

    if (this.shouldSimulateFailure()) {
      throw new Error(`Mock failure: Failed to unregister workflow ${workflowId}`);
    }

    this.workflows.delete(workflowId);
  }

  async executeWorkflow(workflowId: string, context?: any): Promise<string> {
    await this.maybeDelay();

    if (this.shouldSimulateFailure()) {
      throw new Error(`Mock failure: Failed to execute workflow ${workflowId}`);
    }

    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      state: 'running',
      startTime: new Date(),
      nodeExecutions: new Map(),
      context: context || {
        userId: 'test-user',
        sessionId: 'test-session',
        environment: 'development',
        variables: {},
        capabilities: {
          maxMemory: 1024 * 1024 * 1024,
          maxConcurrency: 4,
          serviceWorkerSupport: true,
          indexedDBSupport: true,
          webStreamsSupport: true,
          isIosSafari: false,
        },
      },
      metrics: {
        totalNodes: workflow.nodes.length,
        completedNodes: 0,
        failedNodes: 0,
        averageNodeDuration: 0,
        memoryUsage: 0,
      },
    };

    this.executions.set(executionId, execution);

    // Simulate execution completion after a delay
    setTimeout(() => {
      execution.state = 'completed';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      execution.metrics.completedNodes = workflow.nodes.length;
    }, 100);

    return executionId;
  }

  async cancelExecution(executionId: string): Promise<void> {
    await this.maybeDelay();

    if (this.shouldSimulateFailure()) {
      throw new Error(`Mock failure: Failed to cancel execution ${executionId}`);
    }

    const execution = this.executions.get(executionId);
    if (execution) {
      execution.state = 'cancelled';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
    }
  }

  async pauseExecution(executionId: string): Promise<void> {
    await this.maybeDelay();
    throw new Error('Pause execution not implemented in mock');
  }

  async resumeExecution(executionId: string): Promise<void> {
    await this.maybeDelay();
    throw new Error('Resume execution not implemented in mock');
  }

  async getExecution(executionId: string): Promise<WorkflowExecution | null> {
    await this.maybeDelay();
    return this.executions.get(executionId) || null;
  }

  async getExecutionState(executionId: string): Promise<WorkflowExecution['state']> {
    await this.maybeDelay();
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }
    return execution.state;
  }

  async getNodeExecution(executionId: string, nodeId: string): Promise<any> {
    await this.maybeDelay();
    const execution = this.executions.get(executionId);
    return execution?.nodeExecutions.get(nodeId) || null;
  }

  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    await this.maybeDelay();
    return this.workflows.get(workflowId) || null;
  }

  async listWorkflows(): Promise<Workflow[]> {
    await this.maybeDelay();
    return Array.from(this.workflows.values());
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    await this.maybeDelay();
    this.workflows.delete(workflowId);
  }

  async getExecutionLogs(executionId: string): Promise<any[]> {
    await this.maybeDelay();
    return [
      {
        id: 1,
        timestamp: new Date(),
        level: 'info',
        message: `Execution ${executionId} started`,
        executionId,
      },
    ];
  }

  async getMetrics(executionId?: string): Promise<any> {
    await this.maybeDelay();
    return {
      totalNodes: 5,
      completedNodes: 3,
      failedNodes: 1,
      averageNodeDuration: 150,
      memoryUsage: 1024 * 1024,
    };
  }

  async ping(): Promise<{ timestamp: Date; version: string }> {
    await this.maybeDelay();
    return {
      timestamp: new Date(),
      version: '1.0.0-mock',
    };
  }

  async subscribe(eventType: string, callback: (event: any) => void): Promise<() => void> {
    await this.maybeDelay();

    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    this.eventListeners.get(eventType)!.add(callback);

    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  // Test utilities
  getWorkflowCount(): number {
    return this.workflows.size;
  }

  getExecutionCount(): number {
    return this.executions.size;
  }

  simulateEvent(eventType: string, payload: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback({ type: eventType, payload, timestamp: new Date() });
        } catch (error) {
          console.error('Error in mock event listener:', error);
        }
      });
    }
  }

  reset(): void {
    this.workflows.clear();
    this.executions.clear();
    this.eventListeners.clear();
  }
}

/**
 * Mock BroadcastChannel for testing
 */
export class MockBroadcastChannel {
  private static channels: Map<string, MockBroadcastChannel[]> = new Map();
  public name: string;
  public onmessage: ((event: MessageEvent<BroadcastMessage>) => void) | null = null;
  private listeners: Set<(event: MessageEvent<BroadcastMessage>) => void> = new Set();

  constructor(name: string) {
    this.name = name;

    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, []);
    }
    MockBroadcastChannel.channels.get(name)!.push(this);
  }

  postMessage(message: BroadcastMessage): void {
    const channels = MockBroadcastChannel.channels.get(this.name) || [];

    // Simulate async delivery
    setTimeout(() => {
      channels.forEach((channel) => {
        if (channel !== this) {
          // Don't send to self
          const event = new MessageEvent('message', { data: message });

          if (channel.onmessage) {
            channel.onmessage(event);
          }

          channel.listeners.forEach((listener) => {
            try {
              listener(event);
            } catch (error) {
              console.error('Error in mock broadcast listener:', error);
            }
          });
        }
      });
    }, 0);
  }

  addEventListener(type: string, listener: (event: MessageEvent<BroadcastMessage>) => void): void {
    if (type === 'message') {
      this.listeners.add(listener);
    }
  }

  removeEventListener(
    type: string,
    listener: (event: MessageEvent<BroadcastMessage>) => void
  ): void {
    if (type === 'message') {
      this.listeners.delete(listener);
    }
  }

  close(): void {
    const channels = MockBroadcastChannel.channels.get(this.name) || [];
    const index = channels.indexOf(this);
    if (index > -1) {
      channels.splice(index, 1);
    }

    if (channels.length === 0) {
      MockBroadcastChannel.channels.delete(this.name);
    }

    this.listeners.clear();
  }

  static reset(): void {
    MockBroadcastChannel.channels.clear();
  }

  static getChannelCount(name: string): number {
    return MockBroadcastChannel.channels.get(name)?.length || 0;
  }
}

/**
 * Test harness for Service Worker functionality
 */
export class ServiceWorkerTestHarness {
  private mockAPI: MockServiceWorkerAPI;
  private originalBroadcastChannel: typeof BroadcastChannel;
  private originalServiceWorker: typeof navigator.serviceWorker | undefined;

  constructor(options: MockServiceWorkerOptions = {}) {
    this.mockAPI = new MockServiceWorkerAPI(options);
    this.originalBroadcastChannel = (globalThis as any).BroadcastChannel;
  }

  /**
   * Setup the test environment
   */
  setup(): void {
    // Mock BroadcastChannel
    (globalThis as any).BroadcastChannel = MockBroadcastChannel;

    // Mock Service Worker API if needed
    if (typeof navigator === 'undefined') {
      (globalThis as any).navigator = {};
    }

    if (!navigator.serviceWorker) {
      this.originalServiceWorker = navigator.serviceWorker;
      (navigator as any).serviceWorker = {
        register: vi.fn().mockResolvedValue({
          scope: '/',
          active: { state: 'activated' },
          addEventListener: vi.fn(),
          update: vi.fn(),
          unregister: vi.fn().mockResolvedValue(true),
        }),
        ready: Promise.resolve({
          scope: '/',
          active: { state: 'activated' },
        }),
      };
    }
  }

  /**
   * Cleanup the test environment
   */
  cleanup(): void {
    // Restore original implementations
    (globalThis as any).BroadcastChannel = this.originalBroadcastChannel;

    if (this.originalServiceWorker !== undefined) {
      (navigator as any).serviceWorker = this.originalServiceWorker;
    }

    // Reset mock state
    this.mockAPI.reset();
    MockBroadcastChannel.reset();
  }

  /**
   * Get the mock API instance
   */
  getMockAPI(): MockServiceWorkerAPI {
    return this.mockAPI;
  }

  /**
   * Create a test workflow
   */
  createTestWorkflow(id: string = 'test-workflow'): Workflow {
    return {
      id,
      name: `Test Workflow ${id}`,
      version: '1.0.0',
      nodes: [
        {
          id: 'input-1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { value: 'test input' },
          inputs: [],
          outputs: [{ id: 'out', name: 'output', type: 'any' }],
        },
        {
          id: 'transform-1',
          type: 'transform',
          position: { x: 200, y: 0 },
          data: { transform: 'input.toUpperCase()' },
          inputs: [{ id: 'in', name: 'input', type: 'string' }],
          outputs: [{ id: 'out', name: 'output', type: 'string' }],
        },
        {
          id: 'output-1',
          type: 'output',
          position: { x: 400, y: 0 },
          data: {},
          inputs: [{ id: 'in', name: 'input', type: 'any' }],
          outputs: [],
        },
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'input-1',
          target: 'transform-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
        {
          id: 'edge-2',
          source: 'transform-1',
          target: 'output-1',
          sourceHandle: 'out',
          targetHandle: 'in',
        },
      ],
      metadata: {
        description: 'Test workflow for unit testing',
        tags: ['test'],
        author: 'test-harness',
        isPublic: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Wait for async operations to complete
   */
  async waitForAsyncOps(timeoutMs: number = 1000): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, timeoutMs));
  }

  /**
   * Simulate network latency
   */
  setNetworkDelay(delayMs: number): void {
    this.mockAPI = new MockServiceWorkerAPI({
      ...this.mockAPI['options'],
      delayMs,
    });
  }

  /**
   * Simulate failure conditions
   */
  setFailureRate(rate: number): void {
    this.mockAPI = new MockServiceWorkerAPI({
      ...this.mockAPI['options'],
      failureRate: rate,
    });
  }
}

// Export test utilities
export const testUtils = {
  createWorkflow: (id: string = 'test') => new ServiceWorkerTestHarness().createTestWorkflow(id),
  createMockAPI: (options?: MockServiceWorkerOptions) => new MockServiceWorkerAPI(options),
  createHarness: (options?: MockServiceWorkerOptions) => new ServiceWorkerTestHarness(options),
};
