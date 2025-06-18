# Node Flow Service Worker

A comprehensive Service Worker foundation for background workflow execution with modern TypeScript APIs, Comlink integration, and multi-tab synchronization.

## Features

### 🚀 Core Capabilities
- **Background Workflow Execution**: Execute complex node-based workflows in Service Worker context
- **Type-Safe Communication**: Comlink-powered type-safe communication between main thread and Service Worker
- **Persistent Storage**: IndexedDB-based workflow and execution persistence with error handling
- **Multi-Tab Synchronization**: BroadcastChannel for real-time synchronization across browser tabs
- **Comprehensive Monitoring**: Performance metrics, execution logs, and debugging tools

### 🔧 Built-in Node Types
- **Input/Output**: Data flow entry and exit points
- **Transform**: JavaScript expression-based data transformation
- **Filter**: Conditional data filtering with boolean logic
- **HTTP**: RESTful API requests with proper cancellation support
- **Math**: Mathematical operations (add, subtract, multiply, divide, power, sqrt, etc.)
- **Conditional**: If/else branching logic
- **Merge**: Combine multiple inputs (array, object, concatenation strategies)
- **Logger**: Structured logging with multiple levels
- **Delay**: Time-based execution delays with cancellation

### 📊 Advanced Features
- **Execution Engine**: DAG-based workflow execution with parallel processing
- **Error Handling**: Comprehensive error recovery with retry policies
- **Performance Monitoring**: Memory usage, execution metrics, and system health
- **Browser Capability Detection**: Automatic detection of platform constraints (iOS Safari, memory limits)
- **Cancellation Support**: Graceful workflow and node cancellation with cleanup

## Quick Start

### Installation

```bash
npm install @node-flow/service-worker
# or
pnpm add @node-flow/service-worker
```

### Basic Usage

```typescript
import { createServiceWorkerClient } from '@node-flow/service-worker';

// Initialize Service Worker client
const client = await createServiceWorkerClient({
  scriptUrl: '/service-worker.js',
  enableBroadcast: true,
  onStateChange: (state) => console.log('SW state:', state),
  onError: (error) => console.error('SW error:', error)
});

// Get API proxy
const api = client.getAPI();

// Register a workflow
const workflow = {
  id: 'my-workflow',
  name: 'Demo Workflow',
  version: '1.0.0',
  nodes: [
    {
      id: 'input-1',
      type: 'input',
      position: { x: 0, y: 0 },
      data: { value: 'Hello World!' },
      inputs: [],
      outputs: [{ id: 'out', name: 'output', type: 'string' }]
    },
    {
      id: 'transform-1',
      type: 'transform',
      position: { x: 200, y: 0 },
      data: { transform: 'input.toUpperCase()' },
      inputs: [{ id: 'in', name: 'input', type: 'string' }],
      outputs: [{ id: 'out', name: 'output', type: 'string' }]
    }
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'input-1',
      target: 'transform-1',
      sourceHandle: 'out',
      targetHandle: 'in'
    }
  ],
  metadata: { description: 'Simple demo workflow' },
  createdAt: new Date(),
  updatedAt: new Date()
};

await api.registerWorkflow(workflow);

// Execute workflow
const executionId = await api.executeWorkflow('my-workflow');

// Monitor execution
const execution = await api.getExecution(executionId);
console.log('Execution state:', execution.state);
```

### Multi-Tab Communication

```typescript
// Subscribe to workflow state updates across tabs
client.subscribeToBroadcast('workflow-state-update', (message) => {
  console.log('Workflow updated:', message.payload);
});

// Broadcast custom messages
client.broadcast('custom-event', { data: 'Hello other tabs!' });

// Request sync from other tabs
client.requestSync('my-workflow');
```

## Architecture

### Service Worker Structure
```
src/
├── service-worker.ts          # Main Service Worker implementation
├── sw-client.ts              # Client-side Service Worker interface
├── types/                    # TypeScript type definitions
├── storage/                  # IndexedDB persistence layer
├── communication/           # BroadcastChannel management
├── execution/              # Workflow execution engine
├── utils/                 # Logging and performance monitoring
└── testing/              # Test harness and utilities
```

### Key Components

#### 1. **ServiceWorkerAPI** (Comlink-exposed)
Core API providing workflow management, execution control, and monitoring:

```typescript
interface ServiceWorkerAPI {
  // Workflow Management
  registerWorkflow(workflow: Workflow): Promise<void>;
  executeWorkflow(workflowId: string, context?: ExecutionContext): Promise<string>;
  cancelExecution(executionId: string): Promise<void>;
  
  // Monitoring
  getExecution(executionId: string): Promise<WorkflowExecution | null>;
  getMetrics(executionId?: string): Promise<ExecutionMetrics>;
  getExecutionLogs(executionId: string): Promise<LogEntry[]>;
  
  // Event Subscriptions
  subscribe(eventType: string, callback: (event: SWEvent) => void): Promise<() => void>;
}
```

#### 2. **WorkflowExecutionEngine**
Handles DAG-based workflow execution with parallel processing:

- **Topological Execution**: Resolves node dependencies automatically
- **Concurrent Processing**: Executes independent nodes in parallel
- **Error Recovery**: Configurable error handling strategies
- **State Management**: Persistent execution state with checkpointing

#### 3. **DatabaseManager**
IndexedDB abstraction with structured storage:

- **Workflows**: Persistent workflow definitions
- **Executions**: Execution state and history
- **Node Executions**: Individual node execution results
- **Logs**: Structured logging with filtering
- **Metadata**: System information and cleanup tracking

#### 4. **BroadcastManager**
Multi-tab synchronization with type-safe messaging:

- **Workflow State Updates**: Real-time execution state sync
- **Node Output Updates**: Live data flow visualization
- **Sync Coordination**: Cross-tab workflow management
- **Presence Awareness**: Tab discovery and health monitoring

## Testing

### Test Harness
Comprehensive testing utilities for Service Worker functionality:

```typescript
import { ServiceWorkerTestHarness, testUtils } from '@node-flow/service-worker/testing';

describe('My Feature', () => {
  let harness: ServiceWorkerTestHarness;

  beforeEach(() => {
    harness = new ServiceWorkerTestHarness();
    harness.setup(); // Mocks Service Worker APIs
  });

  afterEach(() => {
    harness.cleanup();
  });

  it('should execute workflow', async () => {
    const workflow = testUtils.createWorkflow('test');
    const mockAPI = harness.getMockAPI();
    
    await mockAPI.registerWorkflow(workflow);
    const executionId = await mockAPI.executeWorkflow(workflow.id);
    
    expect(executionId).toMatch(/^exec_/);
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run Service Worker specific tests
pnpm test:sw
```

## Performance Considerations

### Memory Management
- **Execution Cleanup**: Automatic cleanup of completed executions
- **Log Rotation**: Configurable log retention policies
- **Database Maintenance**: Periodic cleanup of old data
- **Memory Monitoring**: Real-time memory usage tracking

### iOS Safari Compatibility
- **Background Time Limits**: Automatic detection of 30-second limit
- **Capability Detection**: Platform-specific constraint handling
- **Fallback Strategies**: Graceful degradation for limited environments

### Scalability
- **Concurrent Executions**: Support for multiple simultaneous workflows
- **Node Virtualization**: Efficient handling of large workflow graphs
- **Stream Processing**: Backpressure handling for high-throughput scenarios

## Configuration

### Service Worker Options
```typescript
const client = await createServiceWorkerClient({
  scriptUrl: '/custom-sw.js',           // Service Worker script URL
  scope: '/app/',                       // Service Worker scope
  updateViaCache: 'imports',           // Cache update strategy
  enableBroadcast: true,               // Multi-tab communication
  onStateChange: (state) => {},        // State change callback
  onError: (error) => {}               // Error callback
});
```

### Execution Context
```typescript
const executionId = await api.executeWorkflow('workflow-id', {
  userId: 'user-123',
  environment: 'production',
  variables: { apiKey: 'secret' },
  capabilities: {
    maxMemory: 512 * 1024 * 1024,      // 512MB limit
    maxConcurrency: 2,                  // Limit parallel nodes
    backgroundTimeLimit: 30000          // 30 second iOS limit
  }
});
```

## Demo

The package includes a comprehensive demo showing all features:

```bash
# Build the package
pnpm build

# Serve the demo (requires a local server for Service Worker)
# Open packages/service-worker/demo/index.html in browser
```

The demo showcases:
- Workflow registration and execution
- Multi-tab communication
- Real-time execution monitoring
- Performance metrics
- Error handling scenarios

## Browser Support

- **Chrome**: Full support including advanced features
- **Firefox**: Full support with Service Worker and IndexedDB
- **Safari**: Full support with iOS background limitations detected
- **Edge**: Full support on Chromium-based versions

### Service Worker Requirements
- Service Workers must be served over HTTPS (or localhost for development)
- IndexedDB support required for persistence
- BroadcastChannel support required for multi-tab features

## Troubleshooting

### Common Issues

1. **Service Worker Registration Fails**
   ```javascript
   // Ensure HTTPS or localhost
   // Check console for detailed error messages
   console.error('SW registration failed:', error);
   ```

2. **IndexedDB Access Denied**
   ```javascript
   // Check browser privacy settings
   // Ensure not in private/incognito mode
   ```

3. **Broadcast Messages Not Received**
   ```javascript
   // Verify BroadcastChannel support
   if ('BroadcastChannel' in window) {
     // Supported
   }
   ```

### Debug Information
```typescript
// Get comprehensive debug info
const debugInfo = client.getDebugInfo();
console.log('Debug info:', debugInfo);

// Monitor Service Worker state
client.getRegistration()?.addEventListener('updatefound', () => {
  console.log('Service Worker update available');
});
```

## Contributing

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Run tests: `pnpm test`
4. Build: `pnpm build`
5. Test in demo: Open `demo/index.html`

### Development Scripts
```bash
pnpm dev          # Watch mode build
pnpm test         # Run all tests
pnpm test:sw      # Service Worker specific tests
pnpm typecheck    # TypeScript validation
pnpm lint         # Code linting
pnpm build        # Production build
```

## License

MIT License - see LICENSE file for details.
