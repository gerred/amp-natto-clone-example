# Node Flow Development Tooling Research

## Executive Summary

**Recommended Stack:**
- **Build Tool**: Vite with TypeScript monorepo setup using PNPM workspaces
- **Testing**: Vitest for unit/integration, Playwright for E2E, React Testing Library for components
- **Linting/Formatting**: Biome (15x faster than ESLint) with fallback ESLint config
- **Visual Testing**: Playwright visual comparisons for node editor UI
- **Service Worker Testing**: MSW (Mock Service Worker) + custom SW test utilities
- **Performance**: Vitest benchmark API for execution engine, Lighthouse CI for runtime
- **CI/CD**: GitHub Actions with caching, parallel test execution

## 1. Monorepo Build System

### Vite + TypeScript Configuration

**Rationale**: Vite provides instant dev server startup, fast HMR, and excellent TypeScript support. Perfect for our complex frontend architecture with canvas rendering and real-time widgets.

```typescript
// vite.config.ts (root)
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: {
        canvas: resolve(__dirname, 'packages/canvas/src/index.ts'),
        widgets: resolve(__dirname, 'packages/widgets/src/index.ts'),
        runtime: resolve(__dirname, 'packages/runtime/src/index.ts'),
        core: resolve(__dirname, 'packages/core/src/index.ts')
      },
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['react', 'react-dom']
    }
  },
  optimizeDeps: {
    include: ['@shared/types']
  },
  worker: {
    format: 'es' // For Service Worker support
  }
})
```

**PNPM Workspace Structure**:
```json
// package.json (root)
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint"
  }
}

// packages/canvas/package.json
{
  "name": "@nodeflow/canvas",
  "dependencies": {
    "@nodeflow/core": "workspace:*",
    "@nodeflow/types": "workspace:*"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build && tsc --emitDeclarationOnly"
  }
}
```

**TypeScript Configuration**:
```json
// tsconfig.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "paths": {
      "@nodeflow/*": ["./packages/*/src"]
    }
  },
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/canvas" },
    { "path": "./packages/widgets" },
    { "path": "./packages/runtime" }
  ]
}
```

## 2. Testing Framework Strategy

### Vitest for Unit & Integration Testing

**Why Vitest**: Native ESM support, 2x faster than Jest, seamless Vite integration, built-in TypeScript support.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom', // For DOM-heavy canvas tests
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/node_modules/**', '**/dist/**']
    },
    benchmark: {
      include: ['**/*.bench.{js,ts}']
    }
  },
  define: {
    'import.meta.vitest': undefined
  }
})

// test/setup.ts
import { vi } from 'vitest'
import 'jsdom-worker' // Service Worker polyfill for testing

// Mock Service Worker setup
import { server } from './mocks/server'
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Canvas API mocks for node editor testing
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => []),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn()
  }))
})
```

### Playwright for E2E and Visual Testing

**Visual Node Editor Testing Strategy**:
```typescript
// tests/e2e/canvas.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Node Canvas Editor', () => {
  test('should render nodes and connections correctly', async ({ page }) => {
    await page.goto('/canvas')
    
    // Create test workflow
    await page.locator('[data-testid="add-node"]').click()
    await page.locator('[data-testid="node-type-input"]').click()
    
    // Visual regression test for node rendering
    await expect(page.locator('[data-testid="canvas"]')).toHaveScreenshot('basic-workflow.png')
  })

  test('should handle node dragging and connection creation', async ({ page }) => {
    await page.goto('/canvas')
    
    // Test drag and drop functionality
    const sourceNode = page.locator('[data-testid="node-1"]')
    const targetNode = page.locator('[data-testid="node-2"]')
    
    await sourceNode.dragTo(targetNode)
    
    // Verify connection was created
    await expect(page.locator('[data-testid="connection"]')).toBeVisible()
    
    // Visual test for connection rendering
    await expect(page.locator('[data-testid="canvas"]')).toHaveScreenshot('connected-nodes.png')
  })
})
```

**Playwright Configuration**:
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure'
  },
  expect: {
    // Threshold for visual comparisons
    threshold: 0.2,
    toHaveScreenshot: { 
      animations: 'disabled',
      threshold: 0.1 
    }
  }
})
```

### React Testing Library for Component Testing

```typescript
// packages/widgets/src/components/__tests__/StreamingChart.test.tsx
import { render, screen } from '@testing-library/react'
import { StreamingChart } from '../StreamingChart'
import { createMockStream } from '../../test-utils/mockStream'

describe('StreamingChart', () => {
  it('should render chart with streaming data', async () => {
    const mockStream = createMockStream([
      { x: 1, y: 10 },
      { x: 2, y: 15 },
      { x: 3, y: 12 }
    ])

    render(<StreamingChart stream={mockStream} />)
    
    // Wait for data to stream in
    await waitFor(() => {
      expect(screen.getByTestId('chart-svg')).toBeInTheDocument()
    })

    // Test chart rendering
    const chartLines = screen.getAllByTestId('chart-line')
    expect(chartLines).toHaveLength(2) // 3 points = 2 lines
  })

  it('should handle real-time data updates', async () => {
    const mockStream = createMockStream()
    render(<StreamingChart stream={mockStream} />)

    // Simulate real-time data
    act(() => {
      mockStream.push({ x: 1, y: 20 })
    })

    await waitFor(() => {
      expect(screen.getByText('20')).toBeInTheDocument()
    })
  })
})
```

## 3. Linting and Formatting

### Biome (Recommended Primary Choice)

**Why Biome**: 15x faster than ESLint, combines linting and formatting, excellent TypeScript support, zero config for most cases.

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn",
        "noEmptyInterface": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded"
    }
  },
  "files": {
    "include": ["src/**/*.ts", "src/**/*.tsx"],
    "ignore": ["dist/**", "node_modules/**", "*.generated.ts"]
  }
}
```

### ESLint Fallback Configuration

For rules not yet supported by Biome:

```typescript
// eslint.config.js
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  }
]
```

## 4. Service Worker Testing

### MSW + Custom SW Testing Utilities

```typescript
// test/mocks/serviceWorkerMocks.ts
import { setupWorker, rest } from 'msw'

export const serviceWorkerHandlers = [
  rest.post('/api/execute-workflow', (req, res, ctx) => {
    return res(
      ctx.json({
        executionId: 'test-execution-123',
        status: 'running'
      })
    )
  }),

  rest.get('/api/execution/:id/stream', (req, res, ctx) => {
    // Mock streaming execution results
    return res(
      ctx.body(
        new ReadableStream({
          start(controller) {
            controller.enqueue('data: {"nodeId": "input-1", "output": "Hello"}\n\n')
            controller.enqueue('data: {"nodeId": "transform-1", "output": "HELLO"}\n\n')
            controller.close()
          }
        })
      )
    )
  })
]

// Service Worker testing utilities
export class ServiceWorkerTestHarness {
  private worker: ServiceWorker | null = null

  async registerTestWorker(scriptUrl: string) {
    const registration = await navigator.serviceWorker.register(scriptUrl)
    this.worker = registration.active || registration.installing || registration.waiting
    return registration
  }

  async postMessage<T>(message: any): Promise<T> {
    return new Promise((resolve) => {
      const channel = new MessageChannel()
      channel.port1.onmessage = (event) => resolve(event.data)
      
      this.worker?.postMessage(message, [channel.port2])
    })
  }

  async unregister() {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map(reg => reg.unregister()))
  }
}
```

### Service Worker Execution Testing

```typescript
// packages/runtime/src/__tests__/serviceWorkerExecution.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ServiceWorkerTestHarness } from '../../../test/mocks/serviceWorkerMocks'

describe('Service Worker Execution', () => {
  let testHarness: ServiceWorkerTestHarness

  beforeEach(async () => {
    testHarness = new ServiceWorkerTestHarness()
    await testHarness.registerTestWorker('/sw-test.js')
  })

  afterEach(async () => {
    await testHarness.unregister()
  })

  it('should execute workflow in service worker', async () => {
    const workflow = {
      nodes: [
        { id: 'input-1', type: 'input', config: { value: 'test' } },
        { id: 'output-1', type: 'output', config: {} }
      ],
      connections: [
        { from: 'input-1', to: 'output-1', port: 'default' }
      ]
    }

    const result = await testHarness.postMessage({
      type: 'EXECUTE_WORKFLOW',
      payload: workflow
    })

    expect(result).toEqual({
      status: 'completed',
      results: {
        'output-1': 'test'
      }
    })
  })

  it('should handle streaming execution results', async () => {
    const results: any[] = []
    
    // Listen for streaming results
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'EXECUTION_RESULT') {
        results.push(event.data.payload)
      }
    })

    await testHarness.postMessage({
      type: 'START_STREAMING_EXECUTION',
      payload: { workflowId: 'test-workflow' }
    })

    // Wait for streaming to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(results).toHaveLength(2)
    expect(results[0]).toHaveProperty('nodeId', 'input-1')
    expect(results[1]).toHaveProperty('nodeId', 'transform-1')
  })
})
```

## 5. Performance Testing

### Execution Engine Performance

```typescript
// packages/core/src/__tests__/execution.bench.ts
import { bench, describe } from 'vitest'
import { WorkflowExecutor } from '../WorkflowExecutor'
import { createLargeWorkflow } from '../test-utils/workflowFactory'

describe('Workflow Execution Performance', () => {
  bench('execute small workflow (10 nodes)', async () => {
    const executor = new WorkflowExecutor()
    const workflow = createLargeWorkflow(10)
    await executor.execute(workflow)
  })

  bench('execute medium workflow (100 nodes)', async () => {
    const executor = new WorkflowExecutor()
    const workflow = createLargeWorkflow(100)
    await executor.execute(workflow)
  })

  bench('execute large workflow (1000 nodes)', async () => {
    const executor = new WorkflowExecutor()
    const workflow = createLargeWorkflow(1000)
    await executor.execute(workflow)
  })

  bench('concurrent execution (10 workflows)', async () => {
    const executor = new WorkflowExecutor()
    const workflows = Array.from({ length: 10 }, () => createLargeWorkflow(50))
    
    await Promise.all(
      workflows.map(workflow => executor.execute(workflow))
    )
  })
})
```

### Canvas Rendering Performance

```typescript
// packages/canvas/src/__tests__/rendering.bench.ts
import { bench } from 'vitest'
import { CanvasRenderer } from '../CanvasRenderer'
import { createLargeGraph } from '../test-utils/graphFactory'

describe('Canvas Rendering Performance', () => {
  const canvas = document.createElement('canvas')
  canvas.width = 1920
  canvas.height = 1080

  bench('render 100 nodes', () => {
    const renderer = new CanvasRenderer(canvas)
    const graph = createLargeGraph(100)
    renderer.render(graph)
  })

  bench('render 1000 nodes', () => {
    const renderer = new CanvasRenderer(canvas)
    const graph = createLargeGraph(1000)
    renderer.render(graph)
  })

  bench('incremental update (10% change)', () => {
    const renderer = new CanvasRenderer(canvas)
    const graph = createLargeGraph(500)
    
    // Initial render
    renderer.render(graph)
    
    // Update 10% of nodes
    const nodesToUpdate = graph.nodes.slice(0, 50)
    nodesToUpdate.forEach(node => {
      node.position.x += Math.random() * 10
      node.position.y += Math.random() * 10
    })
    
    renderer.updateNodes(nodesToUpdate)
  })
})
```

## 6. Real-Time Testing Patterns

### Streaming Data Testing

```typescript
// packages/widgets/src/test-utils/streamTesting.ts
export class StreamTestHarness {
  private streams = new Map<string, ReadableStream>()
  private controllers = new Map<string, ReadableStreamDefaultController>()

  createMockStream<T>(id: string): ReadableStream<T> {
    const stream = new ReadableStream<T>({
      start: (controller) => {
        this.controllers.set(id, controller)
      }
    })
    
    this.streams.set(id, stream)
    return stream
  }

  pushToStream<T>(id: string, data: T) {
    const controller = this.controllers.get(id)
    if (controller) {
      controller.enqueue(data)
    }
  }

  closeStream(id: string) {
    const controller = this.controllers.get(id)
    if (controller) {
      controller.close()
    }
  }

  async collectStreamData<T>(stream: ReadableStream<T>, maxItems = 10): Promise<T[]> {
    const reader = stream.getReader()
    const items: T[] = []
    
    try {
      while (items.length < maxItems) {
        const { done, value } = await reader.read()
        if (done) break
        items.push(value)
      }
    } finally {
      reader.releaseLock()
    }
    
    return items
  }
}

// Usage in tests
describe('Real-time Widget Updates', () => {
  let streamHarness: StreamTestHarness

  beforeEach(() => {
    streamHarness = new StreamTestHarness()
  })

  it('should update chart in real-time', async () => {
    const stream = streamHarness.createMockStream<DataPoint>('chart-data')
    render(<StreamingChart stream={stream} />)

    // Simulate real-time data
    streamHarness.pushToStream('chart-data', { x: 1, y: 10 })
    streamHarness.pushToStream('chart-data', { x: 2, y: 15 })

    await waitFor(() => {
      expect(screen.getByTestId('data-point-2')).toBeInTheDocument()
    })
  })
})
```

## 7. CI/CD Configuration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Type check
        run: pnpm run type-check
      
      - name: Lint (Biome)
        run: pnpm run lint
      
      - name: Unit tests
        run: pnpm run test:unit
      
      - name: Install Playwright
        run: pnpm exec playwright install
      
      - name: E2E tests
        run: pnpm run test:e2e
      
      - name: Visual regression tests
        run: pnpm run test:visual
      
      - name: Performance benchmarks
        run: pnpm run test:bench
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build packages
        run: pnpm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

### Package Scripts

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "type-check": "turbo type-check",
    "lint": "biome check . && turbo lint",
    "lint:fix": "biome check --apply . && turbo lint:fix",
    "test": "turbo test",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:e2e": "playwright test",
    "test:visual": "playwright test --grep @visual",
    "test:bench": "vitest bench",
    "test:coverage": "vitest run --coverage"
  }
}
```

## 8. Development Workflow Automation

### Turborepo Configuration

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Pre-commit Hooks

```json
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm run lint:fix
pnpm run type-check
pnpm run test:unit --run --reporter=verbose --reporter=summary
```

## 9. Integration Recommendations

### Architecture-Specific Considerations

1. **Canvas Testing**: Use `canvas-mock` for headless testing, Playwright for visual regression
2. **Service Worker**: MSW for API mocking, custom harness for SW-specific functionality  
3. **Streaming**: Create reusable stream testing utilities for consistent real-time testing
4. **Performance**: Benchmark critical paths (workflow execution, canvas rendering)
5. **Visual Testing**: High threshold for visual diffs due to canvas anti-aliasing

### Testing Strategy Priority

1. **Unit Tests (80%)**: Core execution logic, node operations, utilities
2. **Integration Tests (15%)**: Component interactions, stream processing
3. **E2E Tests (5%)**: Critical user workflows, visual regression

### Development Workflow

1. **Local Development**: Vite dev server with HMR, MSW for API mocking
2. **Testing**: Watch mode for units, headless for CI
3. **Quality Gates**: Type checking, linting, test coverage thresholds
4. **Performance Monitoring**: Benchmark regression detection in CI

This tooling setup provides a robust foundation for developing the Node Flow platform with emphasis on real-time performance, visual testing, and Service Worker execution patterns.
