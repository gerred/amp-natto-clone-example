import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BroadcastManager } from '../communication/broadcast.js';
import { MockBroadcastChannel } from '../testing/sw-test-harness.js';

// Mock BroadcastChannel
beforeEach(() => {
  (globalThis as any).BroadcastChannel = MockBroadcastChannel;
});

afterEach(() => {
  MockBroadcastChannel.reset();
});

describe('BroadcastManager', () => {
  let manager: BroadcastManager;

  beforeEach(() => {
    manager = new BroadcastManager();
  });

  afterEach(() => {
    manager.close();
  });

  describe('message broadcasting', () => {
    it('should broadcast generic messages', () => {
      const listener = vi.fn();
      manager.subscribe('test-event', listener);

      manager.broadcast('test-event', { data: 'test' });

      // Messages are delivered asynchronously
      setTimeout(() => {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'test-event',
            payload: { data: 'test' },
            senderId: expect.any(String),
            timestamp: expect.any(Date),
          })
        );
      }, 10);
    });

    it('should broadcast workflow state updates', () => {
      const listener = vi.fn();
      manager.subscribe('workflow-state-update', listener);

      manager.broadcastWorkflowStateUpdate('workflow-1', 'exec-1', 'running', {
        'node-1': 'completed',
        'node-2': 'running',
      });

      setTimeout(() => {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'workflow-state-update',
            payload: {
              workflowId: 'workflow-1',
              executionId: 'exec-1',
              state: 'running',
              nodeStates: { 'node-1': 'completed', 'node-2': 'running' },
            },
          })
        );
      }, 10);
    });

    it('should broadcast node output updates', () => {
      const listener = vi.fn();
      manager.subscribe('node-output-update', listener);

      manager.broadcastNodeOutputUpdate('workflow-1', 'exec-1', 'node-1', {
        result: 'test output',
      });

      setTimeout(() => {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'node-output-update',
            payload: {
              workflowId: 'workflow-1',
              executionId: 'exec-1',
              nodeId: 'node-1',
              outputs: { result: 'test output' },
            },
          })
        );
      }, 10);
    });

    it('should broadcast execution metrics', () => {
      const listener = vi.fn();
      manager.subscribe('execution-metrics-update', listener);

      const metrics = {
        totalNodes: 5,
        completedNodes: 3,
        failedNodes: 1,
        averageNodeDuration: 150,
        memoryUsage: 1024,
      };

      manager.broadcastExecutionMetrics('exec-1', metrics);

      setTimeout(() => {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'execution-metrics-update',
            payload: {
              executionId: 'exec-1',
              metrics,
            },
          })
        );
      }, 10);
    });

    it('should broadcast workflow registration changes', () => {
      const listener = vi.fn();
      manager.subscribe('workflow-registration', listener);

      const workflow = { id: 'workflow-1', name: 'Test Workflow' };

      manager.broadcastWorkflowRegistration(workflow, 'register');

      setTimeout(() => {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'workflow-registration',
            payload: {
              workflow,
              action: 'register',
            },
          })
        );
      }, 10);
    });
  });

  describe('message subscription', () => {
    it('should subscribe to specific message types', () => {
      const listener = vi.fn();
      const unsubscribe = manager.subscribe('test-event', listener);

      expect(typeof unsubscribe).toBe('function');

      manager.broadcast('test-event', { data: 'test' });
      manager.broadcast('other-event', { data: 'other' });

      setTimeout(() => {
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'test-event' }));
      }, 10);
    });

    it('should subscribe to all message types with wildcard', () => {
      const listener = vi.fn();
      manager.subscribe('*', listener);

      manager.broadcast('event-1', { data: '1' });
      manager.broadcast('event-2', { data: '2' });

      setTimeout(() => {
        expect(listener).toHaveBeenCalledTimes(2);
      }, 10);
    });

    it('should unsubscribe from messages', () => {
      const listener = vi.fn();
      const unsubscribe = manager.subscribe('test-event', listener);

      manager.broadcast('test-event', { data: 'before' });
      unsubscribe();
      manager.broadcast('test-event', { data: 'after' });

      setTimeout(() => {
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({ payload: { data: 'before' } })
        );
      }, 10);
    });

    it('should handle multiple listeners for same event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      manager.subscribe('test-event', listener1);
      manager.subscribe('test-event', listener2);

      manager.broadcast('test-event', { data: 'test' });

      setTimeout(() => {
        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
      }, 10);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      manager.subscribe('test-event', errorListener);
      manager.subscribe('test-event', normalListener);

      // Should not throw despite error listener
      expect(() => {
        manager.broadcast('test-event', { data: 'test' });
      }).not.toThrow();

      setTimeout(() => {
        expect(errorListener).toHaveBeenCalled();
        expect(normalListener).toHaveBeenCalled();
      }, 10);
    });
  });

  describe('sync operations', () => {
    it('should request sync from other tabs', () => {
      const listener = vi.fn();
      manager.subscribe('sync-request', listener);

      manager.requestSync('workflow-1');

      setTimeout(() => {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'sync-request',
            payload: {
              workflowId: 'workflow-1',
              requesterId: expect.any(String),
            },
          })
        );
      }, 10);
    });

    it('should respond to sync requests', () => {
      const listener = vi.fn();
      manager.subscribe('sync-response', listener);

      manager.respondToSync('requester-123', { workflows: [] });

      setTimeout(() => {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'sync-response',
            payload: {
              requesterId: 'requester-123',
              data: { workflows: [] },
              responderId: expect.any(String),
            },
          })
        );
      }, 10);
    });

    it('should announce presence', () => {
      const listener = vi.fn();
      manager.subscribe('tab-presence', listener);

      manager.announcePresence();

      setTimeout(() => {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'tab-presence',
            payload: {
              tabId: expect.any(String),
              timestamp: expect.any(Date),
              isServiceWorker: true,
            },
          })
        );
      }, 10);
    });
  });

  describe('message filtering', () => {
    it('should ignore messages from same sender', () => {
      const listener = vi.fn();
      manager.subscribe('test-event', listener);

      // Create another manager with same sender ID (simulating self-message)
      const message = {
        type: 'test-event',
        payload: { data: 'test' },
        senderId: (manager as any).senderId,
        timestamp: new Date(),
      };

      // Simulate receiving own message
      (manager as any).handleMessage({ data: message });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should process messages from different senders', () => {
      const listener = vi.fn();
      manager.subscribe('test-event', listener);

      const message = {
        type: 'test-event',
        payload: { data: 'test' },
        senderId: 'different-sender',
        timestamp: new Date(),
      };

      (manager as any).handleMessage({ data: message });

      expect(listener).toHaveBeenCalledWith(message);
    });
  });

  describe('utility methods', () => {
    it('should return listener count', () => {
      expect(manager.getListenerCount()).toBe(0);

      manager.subscribe('event-1', () => {});
      manager.subscribe('event-2', () => {});
      manager.subscribe('event-1', () => {}); // Second listener for event-1

      expect(manager.getListenerCount()).toBe(3);
    });

    it('should return subscribed types', () => {
      expect(manager.getSubscribedTypes()).toEqual([]);

      manager.subscribe('event-1', () => {});
      manager.subscribe('event-2', () => {});
      manager.subscribe('*', () => {});

      const types = manager.getSubscribedTypes();
      expect(types).toContain('event-1');
      expect(types).toContain('event-2');
      expect(types).toContain('*');
      expect(types).toHaveLength(3);
    });

    it('should clean up on close', () => {
      manager.subscribe('event-1', () => {});
      manager.subscribe('event-2', () => {});

      expect(manager.getListenerCount()).toBeGreaterThan(0);

      manager.close();

      expect(manager.getListenerCount()).toBe(0);
      expect(manager.getSubscribedTypes()).toEqual([]);
    });
  });

  describe('cross-tab communication', () => {
    it('should communicate between multiple managers', () => {
      const manager1 = new BroadcastManager();
      const manager2 = new BroadcastManager();

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      manager1.subscribe('test-event', listener1);
      manager2.subscribe('test-event', listener2);

      // Manager 1 broadcasts
      manager1.broadcast('test-event', { from: 'manager1' });

      setTimeout(() => {
        // Manager 1 should not receive its own message
        expect(listener1).not.toHaveBeenCalled();
        // Manager 2 should receive the message
        expect(listener2).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: { from: 'manager1' },
          })
        );
      }, 10);

      manager1.close();
      manager2.close();
    });

    it('should handle multiple broadcast channels', () => {
      expect(MockBroadcastChannel.getChannelCount('node-flow-sync')).toBe(1);

      const manager2 = new BroadcastManager();
      expect(MockBroadcastChannel.getChannelCount('node-flow-sync')).toBe(2);

      manager2.close();
      expect(MockBroadcastChannel.getChannelCount('node-flow-sync')).toBe(1);
    });
  });
});
