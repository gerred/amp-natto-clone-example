import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NodeExecutor } from '../execution/node-executor.js';
import { Subject, NEVER } from 'rxjs';
import type { WorkflowNode } from '../types/index.js';

describe('NodeExecutor', () => {
  let executor: NodeExecutor;
  let cancelToken: Subject<void>;

  beforeEach(() => {
    executor = new NodeExecutor();
    cancelToken = new Subject<void>();
  });

  afterEach(() => {
    cancelToken.complete();
  });

  describe('handler registration', () => {
    it('should register custom handlers', () => {
      const customHandler = {
        execute: vi.fn().mockResolvedValue({ result: 'custom' }),
      };

      executor.registerHandler('custom', customHandler);

      expect(executor.hasHandler('custom')).toBe(true);
      expect(executor.getRegisteredTypes()).toContain('custom');
    });

    it('should have built-in handlers registered', () => {
      const builtinTypes = [
        'input',
        'output',
        'transform',
        'filter',
        'delay',
        'http',
        'logger',
        'math',
        'conditional',
        'merge',
      ];

      builtinTypes.forEach((type) => {
        expect(executor.hasHandler(type)).toBe(true);
      });
    });
  });

  describe('node execution', () => {
    it('should execute input node', async () => {
      const node: WorkflowNode = {
        id: 'input-1',
        type: 'input',
        position: { x: 0, y: 0 },
        data: { value: 'test input' },
        inputs: [],
        outputs: [{ id: 'out', name: 'output', type: 'any' }],
      };

      const result = await executor.execute(node, {}, NEVER);
      expect(result).toEqual({ value: 'test input' });
    });

    it('should execute output node', async () => {
      const node: WorkflowNode = {
        id: 'output-1',
        type: 'output',
        position: { x: 0, y: 0 },
        data: {},
        inputs: [{ id: 'in', name: 'input', type: 'any' }],
        outputs: [],
      };

      const result = await executor.execute(node, { value: 'test data' }, NEVER);
      expect(result).toEqual({ result: 'test data' });
    });

    it('should execute transform node', async () => {
      const node: WorkflowNode = {
        id: 'transform-1',
        type: 'transform',
        position: { x: 0, y: 0 },
        data: { transform: 'input.toUpperCase()' },
        inputs: [{ id: 'in', name: 'input', type: 'string' }],
        outputs: [{ id: 'out', name: 'output', type: 'string' }],
      };

      const result = await executor.execute(node, { value: 'hello' }, NEVER);
      expect(result).toEqual({ value: 'HELLO' });
    });

    it('should execute filter node', async () => {
      const node: WorkflowNode = {
        id: 'filter-1',
        type: 'filter',
        position: { x: 0, y: 0 },
        data: { condition: 'input > 5' },
        inputs: [{ id: 'in', name: 'input', type: 'number' }],
        outputs: [{ id: 'out', name: 'output', type: 'number' }],
      };

      const result1 = await executor.execute(node, { value: 10 }, NEVER);
      expect(result1).toEqual({ value: 10, passed: true });

      const result2 = await executor.execute(node, { value: 3 }, NEVER);
      expect(result2).toEqual({ value: null, passed: false });
    });

    it('should execute math node', async () => {
      const node: WorkflowNode = {
        id: 'math-1',
        type: 'math',
        position: { x: 0, y: 0 },
        data: { operation: 'add', operand: 5 },
        inputs: [{ id: 'in', name: 'input', type: 'number' }],
        outputs: [{ id: 'out', name: 'output', type: 'number' }],
      };

      const result = await executor.execute(node, { value: 10 }, NEVER);
      expect(result).toEqual({ value: 15 });
    });

    it('should execute conditional node', async () => {
      const node: WorkflowNode = {
        id: 'conditional-1',
        type: 'conditional',
        position: { x: 0, y: 0 },
        data: {
          condition: 'input > 5',
          trueValue: 'large',
          falseValue: 'small',
        },
        inputs: [{ id: 'in', name: 'input', type: 'number' }],
        outputs: [{ id: 'out', name: 'output', type: 'string' }],
      };

      const result1 = await executor.execute(node, { value: 10 }, NEVER);
      expect(result1).toEqual({ value: 'large', condition: true });

      const result2 = await executor.execute(node, { value: 3 }, NEVER);
      expect(result2).toEqual({ value: 'small', condition: false });
    });

    it('should execute merge node', async () => {
      const node: WorkflowNode = {
        id: 'merge-1',
        type: 'merge',
        position: { x: 0, y: 0 },
        data: { strategy: 'array' },
        inputs: [
          { id: 'in1', name: 'input1', type: 'any' },
          { id: 'in2', name: 'input2', type: 'any' },
        ],
        outputs: [{ id: 'out', name: 'output', type: 'array' }],
      };

      const result = await executor.execute(
        node,
        {
          input1: 'hello',
          input2: 'world',
        },
        NEVER
      );
      expect(result).toEqual({ value: ['hello', 'world'] });
    });

    it('should handle missing node handler', async () => {
      const node: WorkflowNode = {
        id: 'unknown-1',
        type: 'unknown',
        position: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: [],
      };

      await expect(executor.execute(node, {}, NEVER)).rejects.toThrow(
        'No handler registered for node type: unknown'
      );
    });
  });

  describe('cancellation handling', () => {
    it('should handle cancellation in delay node', async () => {
      const node: WorkflowNode = {
        id: 'delay-1',
        type: 'delay',
        position: { x: 0, y: 0 },
        data: { delay: 1000 },
        inputs: [{ id: 'in', name: 'input', type: 'any' }],
        outputs: [{ id: 'out', name: 'output', type: 'any' }],
      };

      const promise = executor.execute(node, { value: 'test' }, cancelToken);

      // Cancel after 100ms
      setTimeout(() => cancelToken.next(), 100);

      await expect(promise).rejects.toThrow('Node execution cancelled');
    });

    it('should handle cancellation in HTTP node', async () => {
      // Mock fetch to be cancelable
      const mockFetch = vi.fn().mockImplementation((url, options) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              headers: new Map([['content-type', 'application/json']]),
              json: () => Promise.resolve({ data: 'test' }),
            });
          }, 1000);

          // Handle abort signal
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              reject(new Error('AbortError'));
            });
          }
        });
      });
      global.fetch = mockFetch;

      const node: WorkflowNode = {
        id: 'http-1',
        type: 'http',
        position: { x: 0, y: 0 },
        data: { url: 'https://api.example.com/data' },
        inputs: [],
        outputs: [{ id: 'out', name: 'output', type: 'any' }],
      };

      const promise = executor.execute(node, {}, cancelToken);

      // Cancel after 100ms
      setTimeout(() => cancelToken.next(), 100);

      await expect(promise).rejects.toThrow('HTTP request cancelled');
    });
  });

  describe('error handling', () => {
    it('should handle transform errors', async () => {
      const node: WorkflowNode = {
        id: 'transform-1',
        type: 'transform',
        position: { x: 0, y: 0 },
        data: { transform: 'invalid.syntax.here()' },
        inputs: [{ id: 'in', name: 'input', type: 'any' }],
        outputs: [{ id: 'out', name: 'output', type: 'any' }],
      };

      await expect(executor.execute(node, { value: 'test' }, NEVER)).rejects.toThrow(
        'Transform execution failed'
      );
    });

    it('should handle filter errors', async () => {
      const node: WorkflowNode = {
        id: 'filter-1',
        type: 'filter',
        position: { x: 0, y: 0 },
        data: { condition: 'invalid.syntax.here()' },
        inputs: [{ id: 'in', name: 'input', type: 'any' }],
        outputs: [{ id: 'out', name: 'output', type: 'any' }],
      };

      await expect(executor.execute(node, { value: 'test' }, NEVER)).rejects.toThrow(
        'Filter condition failed'
      );
    });

    it('should handle math errors', async () => {
      const node: WorkflowNode = {
        id: 'math-1',
        type: 'math',
        position: { x: 0, y: 0 },
        data: { operation: 'divide', operand: 0 },
        inputs: [{ id: 'in', name: 'input', type: 'number' }],
        outputs: [{ id: 'out', name: 'output', type: 'number' }],
      };

      await expect(executor.execute(node, { value: 10 }, NEVER)).rejects.toThrow(
        'Division by zero'
      );
    });

    it('should handle HTTP errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
      global.fetch = mockFetch;

      const node: WorkflowNode = {
        id: 'http-1',
        type: 'http',
        position: { x: 0, y: 0 },
        data: { url: 'https://api.example.com/notfound' },
        inputs: [],
        outputs: [{ id: 'out', name: 'output', type: 'any' }],
      };

      await expect(executor.execute(node, {}, NEVER)).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should handle missing required data', async () => {
      const node: WorkflowNode = {
        id: 'http-1',
        type: 'http',
        position: { x: 0, y: 0 },
        data: {}, // Missing URL
        inputs: [],
        outputs: [{ id: 'out', name: 'output', type: 'any' }],
      };

      await expect(executor.execute(node, {}, NEVER)).rejects.toThrow('HTTP node requires a URL');
    });
  });

  describe('complex operations', () => {
    it('should handle HTTP POST with JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = mockFetch;

      const node: WorkflowNode = {
        id: 'http-1',
        type: 'http',
        position: { x: 0, y: 0 },
        data: {
          url: 'https://api.example.com/create',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { name: 'test' },
        },
        inputs: [],
        outputs: [{ id: 'out', name: 'output', type: 'any' }],
      };

      const result = await executor.execute(node, {}, NEVER);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/create',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{"name":"test"}',
        })
      );

      expect(result).toEqual({
        status: 200,
        headers: { 'content-type': 'application/json' },
        data: { success: true },
      });
    });

    it('should handle all math operations', async () => {
      const operations = [
        { op: 'add', operand: 5, input: 10, expected: 15 },
        { op: 'subtract', operand: 3, input: 10, expected: 7 },
        { op: 'multiply', operand: 2, input: 10, expected: 20 },
        { op: 'divide', operand: 2, input: 10, expected: 5 },
        { op: 'power', operand: 2, input: 3, expected: 9 },
        { op: 'sqrt', operand: undefined, input: 16, expected: 4 },
        { op: 'abs', operand: undefined, input: -5, expected: 5 },
        { op: 'round', operand: undefined, input: 3.7, expected: 4 },
        { op: 'floor', operand: undefined, input: 3.7, expected: 3 },
        { op: 'ceil', operand: undefined, input: 3.2, expected: 4 },
      ];

      for (const { op, operand, input, expected } of operations) {
        const node: WorkflowNode = {
          id: `math-${op}`,
          type: 'math',
          position: { x: 0, y: 0 },
          data: { operation: op, operand },
          inputs: [{ id: 'in', name: 'input', type: 'number' }],
          outputs: [{ id: 'out', name: 'output', type: 'number' }],
        };

        const result = await executor.execute(node, { value: input }, NEVER);
        expect(result.value).toBe(expected);
      }
    });

    it('should handle merge strategies', async () => {
      const strategies = [
        {
          strategy: 'array',
          inputs: { a: 1, b: 2, c: 3 },
          expected: [1, 2, 3],
        },
        {
          strategy: 'object',
          inputs: { a: 1, b: 2, c: 3 },
          expected: { a: 1, b: 2, c: 3 },
        },
        {
          strategy: 'concat',
          inputs: { a: 'hello', b: ' ', c: 'world' },
          expected: 'hello world',
        },
      ];

      for (const { strategy, inputs, expected } of strategies) {
        const node: WorkflowNode = {
          id: `merge-${strategy}`,
          type: 'merge',
          position: { x: 0, y: 0 },
          data: { strategy },
          inputs: Object.keys(inputs).map((key) => ({
            id: key,
            name: key,
            type: 'any',
          })),
          outputs: [{ id: 'out', name: 'output', type: 'any' }],
        };

        const result = await executor.execute(node, inputs, NEVER);
        expect(result.value).toEqual(expected);
      }
    });
  });
});
