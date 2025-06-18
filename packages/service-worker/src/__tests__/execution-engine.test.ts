import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkflowExecutionEngine } from '../execution/engine.js';
import { testUtils } from '../testing/sw-test-harness.js';
import type { Workflow, ExecutionContext } from '../types/index.js';

// Mock the database
vi.mock('../storage/db.js', () => ({
  db: {
    initialize: vi.fn(),
    saveExecution: vi.fn(),
    saveNodeExecution: vi.fn(),
    getWorkflow: vi.fn(),
    saveWorkflow: vi.fn(),
    cleanup: vi.fn(),
  },
}));

// Mock broadcast manager
vi.mock('../communication/broadcast.js', () => ({
  broadcastManager: {
    broadcastWorkflowStateUpdate: vi.fn(),
    broadcastNodeOutputUpdate: vi.fn(),
    broadcastExecutionMetrics: vi.fn(),
    announcePresence: vi.fn(),
  },
}));

describe('WorkflowExecutionEngine', () => {
  let engine: WorkflowExecutionEngine;
  let testWorkflow: Workflow;

  beforeEach(() => {
    engine = new WorkflowExecutionEngine();
    testWorkflow = testUtils.createWorkflow('test-execution');
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('workflow execution', () => {
    it('should execute a simple workflow', async () => {
      const executionId = await engine.executeWorkflow(testWorkflow);

      expect(executionId).toMatch(/^exec_\d+_/);

      const execution = engine.getExecution(executionId);
      expect(execution).toBeTruthy();
      expect(execution?.workflowId).toBe(testWorkflow.id);
      expect(execution?.state).toBe('pending');
    });

    it('should execute workflow with custom context', async () => {
      const context: Partial<ExecutionContext> = {
        userId: 'test-user',
        environment: 'production',
        variables: { testVar: 'testValue' },
      };

      const executionId = await engine.executeWorkflow(testWorkflow, context);
      const execution = engine.getExecution(executionId);

      expect(execution?.context.userId).toBe('test-user');
      expect(execution?.context.environment).toBe('production');
      expect(execution?.context.variables.testVar).toBe('testValue');
    });

    it('should initialize node executions', async () => {
      const executionId = await engine.executeWorkflow(testWorkflow);
      const execution = engine.getExecution(executionId);

      expect(execution?.nodeExecutions.size).toBe(testWorkflow.nodes.length);

      testWorkflow.nodes.forEach((node) => {
        const nodeExecution = execution?.nodeExecutions.get(node.id);
        expect(nodeExecution).toBeTruthy();
        expect(nodeExecution?.nodeId).toBe(node.id);
        expect(nodeExecution?.state).toBe('pending');
      });
    });

    it('should track execution metrics', async () => {
      const executionId = await engine.executeWorkflow(testWorkflow);
      const execution = engine.getExecution(executionId);

      expect(execution?.metrics).toEqual({
        totalNodes: testWorkflow.nodes.length,
        completedNodes: 0,
        failedNodes: 0,
        averageNodeDuration: 0,
        memoryUsage: expect.any(Number),
      });
    });
  });

  describe('execution cancellation', () => {
    it('should cancel running execution', async () => {
      const executionId = await engine.executeWorkflow(testWorkflow);

      await engine.cancelExecution(executionId);

      const execution = engine.getExecution(executionId);
      expect(execution?.state).toBe('cancelled');
      expect(execution?.endTime).toBeTruthy();
    });

    it('should handle cancellation of non-existent execution', async () => {
      await expect(engine.cancelExecution('non-existent')).rejects.toThrow(
        'Execution non-existent not found'
      );
    });

    it('should not cancel already completed execution', async () => {
      const executionId = await engine.executeWorkflow(testWorkflow);
      const execution = engine.getExecution(executionId);

      // Manually mark as completed
      if (execution) {
        execution.state = 'completed';
      }

      await engine.cancelExecution(executionId);

      // Should remain completed
      expect(execution?.state).toBe('completed');
    });
  });

  describe('execution monitoring', () => {
    it('should provide execution observable', async () => {
      const executionId = await engine.executeWorkflow(testWorkflow);
      const observable = engine.getExecutionObservable(executionId);

      expect(observable).toBeTruthy();

      const values: any[] = [];
      const subscription = observable?.subscribe((value) => values.push(value));

      // Should emit initial state
      expect(values.length).toBeGreaterThan(0);

      subscription?.unsubscribe();
    });

    it('should list active executions', async () => {
      const executionId1 = await engine.executeWorkflow(testWorkflow);
      const executionId2 = await engine.executeWorkflow(testWorkflow);

      const activeExecutions = engine.getActiveExecutions();
      expect(activeExecutions).toHaveLength(2);

      const executionIds = activeExecutions.map((e) => e.id);
      expect(executionIds).toContain(executionId1);
      expect(executionIds).toContain(executionId2);
    });

    it('should return null for non-existent execution', () => {
      const execution = engine.getExecution('non-existent');
      expect(execution).toBeNull();
    });

    it('should return null for non-existent execution observable', () => {
      const observable = engine.getExecutionObservable('non-existent');
      expect(observable).toBeNull();
    });
  });

  describe('browser capability detection', () => {
    it('should detect capabilities', async () => {
      const executionId = await engine.executeWorkflow(testWorkflow);
      const execution = engine.getExecution(executionId);

      expect(execution?.context.capabilities).toEqual({
        maxMemory: expect.any(Number),
        maxConcurrency: expect.any(Number),
        serviceWorkerSupport: expect.any(Boolean),
        indexedDBSupport: expect.any(Boolean),
        webStreamsSupport: expect.any(Boolean),
        isIosSafari: expect.any(Boolean),
        backgroundTimeLimit: expect.any(Number),
      });
    });

    it('should detect iOS Safari constraints', () => {
      // Mock iOS Safari user agent
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        configurable: true,
      });

      const context = (engine as any).createExecutionContext({});
      expect(context.capabilities.isIosSafari).toBe(true);
      expect(context.capabilities.backgroundTimeLimit).toBe(30000);

      // Restore
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });
  });

  describe('error handling', () => {
    it('should handle node execution errors gracefully', async () => {
      // Create workflow with invalid transform
      const errorWorkflow: Workflow = {
        ...testWorkflow,
        nodes: [
          {
            id: 'error-node',
            type: 'transform',
            position: { x: 0, y: 0 },
            data: { transform: 'invalid.code.here()' },
            inputs: [{ id: 'in', name: 'input', type: 'any' }],
            outputs: [{ id: 'out', name: 'output', type: 'any' }],
          },
        ],
        edges: [],
      };

      const executionId = await engine.executeWorkflow(errorWorkflow);

      // Wait for execution to process
      await new Promise((resolve) => setTimeout(resolve, 100));

      const execution = engine.getExecution(executionId);
      expect(execution?.state).toBe('failed');
    });

    it('should handle circular dependencies', async () => {
      const circularWorkflow: Workflow = {
        ...testWorkflow,
        nodes: [
          {
            id: 'node-a',
            type: 'transform',
            position: { x: 0, y: 0 },
            data: {},
            inputs: [{ id: 'in', name: 'input', type: 'any' }],
            outputs: [{ id: 'out', name: 'output', type: 'any' }],
          },
          {
            id: 'node-b',
            type: 'transform',
            position: { x: 100, y: 0 },
            data: {},
            inputs: [{ id: 'in', name: 'input', type: 'any' }],
            outputs: [{ id: 'out', name: 'output', type: 'any' }],
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-a',
            target: 'node-b',
            sourceHandle: 'out',
            targetHandle: 'in',
          },
          {
            id: 'edge-2',
            source: 'node-b',
            target: 'node-a',
            sourceHandle: 'out',
            targetHandle: 'in',
          },
        ],
      };

      const executionId = await engine.executeWorkflow(circularWorkflow);

      // Wait for execution to detect circular dependency
      await new Promise((resolve) => setTimeout(resolve, 100));

      const execution = engine.getExecution(executionId);
      expect(execution?.state).toBe('failed');
    });
  });

  describe('cleanup and shutdown', () => {
    it('should cleanup completed executions', async () => {
      const executionId = await engine.executeWorkflow(testWorkflow);
      const execution = engine.getExecution(executionId);

      // Manually mark as completed
      if (execution) {
        execution.state = 'completed';
        execution.endTime = new Date();
      }

      // Trigger cleanup (normally happens after delay)
      (engine as any).cleanupExecution(executionId);

      // Should still exist immediately after cleanup call
      expect(engine.getExecution(executionId)).toBeTruthy();
    });

    it('should shutdown gracefully', async () => {
      const executionId1 = await engine.executeWorkflow(testWorkflow);
      const executionId2 = await engine.executeWorkflow(testWorkflow);

      await engine.shutdown();

      // All executions should be cancelled
      const execution1 = engine.getExecution(executionId1);
      const execution2 = engine.getExecution(executionId2);

      expect(execution1?.state).toBe('cancelled');
      expect(execution2?.state).toBe('cancelled');
    });
  });

  describe('ID generation', () => {
    it('should generate unique execution IDs', async () => {
      const id1 = await engine.executeWorkflow(testWorkflow);
      const id2 = await engine.executeWorkflow(testWorkflow);

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^exec_\d+_/);
      expect(id2).toMatch(/^exec_\d+_/);
    });
  });
});
