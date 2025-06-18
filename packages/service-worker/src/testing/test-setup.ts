import { vi } from 'vitest';
import { ServiceWorkerTestHarness } from './sw-test-harness.js';

// Global test harness
let testHarness: ServiceWorkerTestHarness;

// Setup before each test
beforeEach(() => {
  testHarness = new ServiceWorkerTestHarness();
  testHarness.setup();

  // Mock fetch for HTTP requests
  global.fetch = vi.fn();

  // Mock performance API
  if (!global.performance) {
    global.performance = {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
    } as any;
  }

  // Mock navigator.hardwareConcurrency
  if (!navigator.hardwareConcurrency) {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 4,
      configurable: true,
    });
  }

  // Mock IndexedDB if not available
  if (!global.indexedDB) {
    global.indexedDB = {
      open: vi.fn(),
      deleteDatabase: vi.fn(),
      databases: vi.fn(() => Promise.resolve([])),
    } as any;
  }
});

// Cleanup after each test
afterEach(() => {
  testHarness?.cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// Global test utilities
declare global {
  var testHarness: ServiceWorkerTestHarness;
}

global.testHarness = testHarness;
