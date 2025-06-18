import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServiceWorkerClient, createServiceWorkerClient } from '../sw-client.js';
import { ServiceWorkerTestHarness } from '../testing/sw-test-harness.js';

describe('ServiceWorkerClient', () => {
  let harness: ServiceWorkerTestHarness;
  let client: ServiceWorkerClient;

  beforeEach(() => {
    harness = new ServiceWorkerTestHarness();
    harness.setup();
  });

  afterEach(() => {
    harness.cleanup();
  });

  describe('initialization', () => {
    it('should initialize successfully with default options', async () => {
      client = new ServiceWorkerClient();
      await client.initialize();

      expect(client.isReady()).toBe(true);
      expect(client.getRegistration()).toBeTruthy();
    });

    it('should initialize with custom options', async () => {
      const options = {
        scriptUrl: '/custom-sw.js',
        scope: '/custom/',
        enableBroadcast: false,
      };

      client = new ServiceWorkerClient(options);
      await client.initialize();

      expect(client.isReady()).toBe(true);
      const debugInfo = client.getDebugInfo();
      expect(debugInfo.broadcastEnabled).toBe(false);
    });

    it('should handle service worker not supported', async () => {
      // Mock unsupported environment
      const originalServiceWorker = navigator.serviceWorker;
      delete (navigator as any).serviceWorker;

      client = new ServiceWorkerClient();

      await expect(client.initialize()).rejects.toThrow(
        'Service Workers are not supported in this browser'
      );

      // Restore
      (navigator as any).serviceWorker = originalServiceWorker;
    });

    it('should handle registration failure', async () => {
      const mockRegister = vi.fn().mockRejectedValue(new Error('Registration failed'));
      navigator.serviceWorker.register = mockRegister;

      client = new ServiceWorkerClient();

      await expect(client.initialize()).rejects.toThrow('Registration failed');
    });
  });

  describe('API proxy', () => {
    beforeEach(async () => {
      client = new ServiceWorkerClient();
      await client.initialize();
    });

    it('should provide API proxy', () => {
      const api = client.getAPI();
      expect(api).toBeTruthy();
      expect(typeof api.ping).toBe('function');
    });

    it('should throw error when not initialized', () => {
      const uninitializedClient = new ServiceWorkerClient();
      expect(() => uninitializedClient.getAPI()).toThrow('Service Worker not initialized');
    });
  });

  describe('broadcast communication', () => {
    beforeEach(async () => {
      client = new ServiceWorkerClient({ enableBroadcast: true });
      await client.initialize();
    });

    it('should subscribe to broadcast messages', () => {
      const callback = vi.fn();
      const unsubscribe = client.subscribeToBroadcast('test-event', callback);

      expect(typeof unsubscribe).toBe('function');

      // Test unsubscribe
      unsubscribe();
      const debugInfo = client.getDebugInfo();
      expect(debugInfo.broadcastListenerCount).toBe(0);
    });

    it('should broadcast messages', () => {
      const callback = vi.fn();
      client.subscribeToBroadcast('test-event', callback);

      client.broadcast('test-event', { data: 'test' });

      // Messages are delivered asynchronously
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'test-event',
            payload: { data: 'test' },
          })
        );
      }, 10);
    });

    it('should handle wildcard subscriptions', () => {
      const callback = vi.fn();
      client.subscribeToBroadcast('*', callback);

      client.broadcast('any-event', { data: 'test' });

      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
      }, 10);
    });

    it('should throw error when broadcast disabled', async () => {
      const noBroadcastClient = new ServiceWorkerClient({ enableBroadcast: false });
      await noBroadcastClient.initialize();

      expect(() => {
        noBroadcastClient.subscribeToBroadcast('test', () => {});
      }).toThrow('Broadcast communication is disabled');
    });
  });

  describe('lifecycle management', () => {
    beforeEach(async () => {
      client = new ServiceWorkerClient();
      await client.initialize();
    });

    it('should update service worker', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      const registration = client.getRegistration();
      if (registration) {
        registration.update = mockUpdate;
      }

      await client.update();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should unregister service worker', async () => {
      const mockUnregister = vi.fn().mockResolvedValue(true);
      const registration = client.getRegistration();
      if (registration) {
        registration.unregister = mockUnregister;
      }

      await client.unregister();
      expect(mockUnregister).toHaveBeenCalled();
      expect(client.getRegistration()).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle state change errors', async () => {
      const onError = vi.fn();
      client = new ServiceWorkerClient({ onError });

      // Mock a registration error
      const mockRegister = vi.fn().mockRejectedValue(new Error('Test error'));
      navigator.serviceWorker.register = mockRegister;

      await expect(client.initialize()).rejects.toThrow('Test error');
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle broadcast listener errors', () => {
      client = new ServiceWorkerClient({ enableBroadcast: true });

      const faultyCallback = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      // Should not throw even if listener fails
      expect(() => {
        client.subscribeToBroadcast('test', faultyCallback);
        client.broadcast('test', {});
      }).not.toThrow();
    });
  });

  describe('convenience function', () => {
    it('should create and initialize client', async () => {
      const client = await createServiceWorkerClient();
      expect(client.isReady()).toBe(true);
    });

    it('should create client with options', async () => {
      const client = await createServiceWorkerClient({
        enableBroadcast: false,
      });

      const debugInfo = client.getDebugInfo();
      expect(debugInfo.broadcastEnabled).toBe(false);
    });
  });

  describe('debug information', () => {
    beforeEach(async () => {
      client = new ServiceWorkerClient();
      await client.initialize();
    });

    it('should provide comprehensive debug info', () => {
      const debugInfo = client.getDebugInfo();

      expect(debugInfo).toHaveProperty('isReady');
      expect(debugInfo).toHaveProperty('registration');
      expect(debugInfo).toHaveProperty('broadcastEnabled');
      expect(debugInfo).toHaveProperty('broadcastListenerCount');
      expect(debugInfo).toHaveProperty('options');

      expect(debugInfo.isReady).toBe(true);
      expect(debugInfo.registration).toBeTruthy();
    });
  });
});
