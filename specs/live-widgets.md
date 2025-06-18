# Live Widget System Specification

## Overview

The Live Widget System enables real-time, interactive components embedded within Node Flow's visual workflow editor. Widgets provide immediate visual feedback, user interaction, and dynamic updates as workflows execute, transforming static nodes into living, breathing interfaces.

## 1. Widget Framework Architecture

### Core Components

```typescript
interface Widget {
  id: string;
  type: WidgetType;
  nodeId: string;
  config: WidgetConfig;
  state: WidgetState;
  lifecycle: WidgetLifecycle;
}

interface WidgetType {
  name: string;
  version: string;
  renderer: WidgetRenderer;
  schema: JSONSchema;
  capabilities: WidgetCapabilities;
}
```

### Architecture Layers

- **Widget Engine**: Core execution and lifecycle management
- **Renderer Layer**: DOM manipulation and view updates
- **Data Layer**: State management and real-time synchronization
- **Event Layer**: User interaction and system event handling
- **Integration Layer**: Node workflow system bridge

## 2. Real-time Data Binding

### Data Flow Architecture

```typescript
interface DataBinding {
  source: DataSource;
  target: WidgetProperty;
  transform?: TransformFunction;
  updateMode: 'push' | 'pull' | 'bidirectional';
  throttle?: number;
}

interface DataSource {
  type: 'node-output' | 'workflow-variable' | 'external-api';
  path: string;
  subscription: SubscriptionConfig;
}
```

### Update Mechanisms

- **Stream-based Updates**: WebSocket connections for real-time data
- **Event-driven Updates**: Reactive subscriptions to node outputs
- **Polling Updates**: Configurable intervals for external data
- **Batch Updates**: Efficient bulk updates for high-frequency data

### Data Synchronization

```typescript
class DataSyncManager {
  subscribe(widget: Widget, binding: DataBinding): Subscription;
  publish(nodeId: string, data: any): void;
  batch(updates: Update[]): void;
  throttle(binding: DataBinding, interval: number): void;
}
```

## 3. Widget Lifecycle Management

### Lifecycle Phases

```typescript
enum WidgetLifecycle {
  INITIALIZING = 'initializing',
  MOUNTING = 'mounting',
  ACTIVE = 'active',
  UPDATING = 'updating',
  PAUSED = 'paused',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed'
}
```

### Lifecycle Hooks

```typescript
interface WidgetLifecycleHooks {
  onInitialize?(config: WidgetConfig): void;
  onMount?(container: Element): void;
  onUpdate?(data: any): void;
  onPause?(): void;
  onResume?(): void;
  onDestroy?(): void;
}
```

### State Transitions

- **Initialization**: Widget creation and configuration
- **Mounting**: DOM attachment and initial render
- **Active**: Receiving updates and handling interactions
- **Paused**: Workflow paused, widget maintains state
- **Updating**: Receiving new data or configuration changes
- **Cleanup**: Resource deallocation and DOM removal

## 4. Embedded View System

### View Container Architecture

```typescript
interface ViewContainer {
  id: string;
  nodeId: string;
  dimensions: ContainerDimensions;
  viewport: ViewportConfig;
  widgets: Widget[];
  layout: LayoutManager;
}

interface ContainerDimensions {
  width: number;
  height: number;
  aspectRatio?: number;
  resizable: boolean;
  constraints: SizeConstraints;
}
```

### Layout Management

- **Grid Layout**: Responsive grid system for multiple widgets
- **Stack Layout**: Layered widgets with z-index management
- **Flow Layout**: Dynamic positioning based on content
- **Custom Layout**: Programmable positioning logic

### Viewport Integration

```typescript
class ViewportManager {
  createContainer(nodeId: string, config: ViewportConfig): ViewContainer;
  resizeContainer(containerId: string, dimensions: ContainerDimensions): void;
  optimizeViewport(container: ViewContainer): void;
}
```

## 5. Widget Component Library

### Core Widget Types

#### Chart Widgets
```typescript
interface ChartWidget extends Widget {
  type: 'chart';
  chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
  data: ChartData;
  options: ChartOptions;
  interactions: ChartInteractions;
}
```

#### Form Widgets
```typescript
interface FormWidget extends Widget {
  type: 'form';
  fields: FormField[];
  validation: ValidationRules;
  submission: SubmissionConfig;
  layout: FormLayout;
}
```

#### Dashboard Widgets
```typescript
interface DashboardWidget extends Widget {
  type: 'dashboard';
  panels: DashboardPanel[];
  layout: DashboardLayout;
  filters: FilterConfig[];
  actions: ActionConfig[];
}
```

#### Data Table Widgets
```typescript
interface DataTableWidget extends Widget {
  type: 'data-table';
  columns: TableColumn[];
  data: TableData;
  pagination: PaginationConfig;
  sorting: SortingConfig;
  filtering: FilteringConfig;
}
```

#### Media Widgets
```typescript
interface MediaWidget extends Widget {
  type: 'media';
  mediaType: 'image' | 'video' | 'audio' | 'document';
  source: MediaSource;
  controls: MediaControls;
  metadata: MediaMetadata;
}
```

## 6. Custom Widget Development

### Widget Development Kit (WDK)

```typescript
abstract class CustomWidget implements Widget {
  abstract render(container: Element, data: any): void;
  abstract update(data: any): void;
  abstract destroy(): void;
  
  protected registerEventHandlers(): void;
  protected validateData(data: any): boolean;
  protected emitEvent(event: WidgetEvent): void;
}
```

### Widget Registration

```typescript
interface WidgetRegistry {
  register(type: WidgetType, factory: WidgetFactory): void;
  unregister(typeName: string): void;
  create(type: string, config: WidgetConfig): Widget;
  getAvailable(): WidgetType[];
}
```

### Development Tools

- **Widget Playground**: Interactive development environment
- **Hot Reload**: Real-time widget updates during development
- **Debug Panel**: Widget state inspection and performance metrics
- **Testing Framework**: Unit and integration testing utilities

### Custom Widget Example

```typescript
class CustomGaugeWidget extends CustomWidget {
  private gauge: GaugeComponent;
  
  render(container: Element, data: any): void {
    this.gauge = new GaugeComponent({
      value: data.value,
      min: data.min,
      max: data.max,
      thresholds: data.thresholds
    });
    container.appendChild(this.gauge.element);
  }
  
  update(data: any): void {
    this.gauge.setValue(data.value);
    this.gauge.setThresholds(data.thresholds);
  }
}
```

## 7. Interactive Capabilities & Event Handling

### Event System Architecture

```typescript
interface WidgetEvent {
  type: WidgetEventType;
  source: Widget;
  target?: string;
  data: any;
  timestamp: number;
  propagate: boolean;
}

enum WidgetEventType {
  CLICK = 'click',
  CHANGE = 'change',
  SUBMIT = 'submit',
  SELECT = 'select',
  HOVER = 'hover',
  CUSTOM = 'custom'
}
```

### Event Handling

```typescript
class EventManager {
  addEventListener(widget: Widget, event: WidgetEventType, handler: EventHandler): void;
  removeEventListener(widget: Widget, event: WidgetEventType, handler: EventHandler): void;
  emit(event: WidgetEvent): void;
  propagate(event: WidgetEvent, targets: Widget[]): void;
}
```

### User Interaction Types

- **Direct Manipulation**: Drag, drop, resize, pan, zoom
- **Data Input**: Forms, sliders, toggles, text input
- **Selection**: Single/multi-select, filtering, sorting
- **Navigation**: Pagination, drilling down, breadcrumbs
- **Action Triggers**: Buttons, links, context menus

### Workflow Integration

```typescript
interface WorkflowAction {
  trigger: WidgetEvent;
  action: 'execute-node' | 'set-variable' | 'trigger-workflow';
  target: string;
  parameters: Record<string, any>;
}
```

## 8. Performance Optimization

### Rendering Optimization

- **Virtual Scrolling**: Efficient rendering of large datasets
- **Lazy Loading**: On-demand widget initialization
- **Batch Updates**: Grouped DOM operations
- **Memoization**: Cached computed values and renders

### Memory Management

```typescript
class PerformanceManager {
  trackWidget(widget: Widget): void;
  optimizeMemory(): void;
  scheduleCleanup(widget: Widget): void;
  monitorPerformance(): PerformanceMetrics;
}
```

### Update Strategies

- **Debounced Updates**: Prevent excessive re-renders
- **Selective Updates**: Only update changed properties
- **Background Processing**: Non-blocking computations
- **Progressive Loading**: Incremental data loading

### Performance Metrics

```typescript
interface PerformanceMetrics {
  renderTime: number;
  updateFrequency: number;
  memoryUsage: number;
  eventLatency: number;
  throughput: number;
}
```

## 9. Workflow Execution Integration

### Execution Context

```typescript
interface ExecutionContext {
  workflowId: string;
  nodeId: string;
  executionId: string;
  state: ExecutionState;
  variables: Record<string, any>;
}
```

### Node-Widget Binding

```typescript
interface NodeWidgetBinding {
  nodeId: string;
  widgets: Widget[];
  dataFlow: DataFlowConfig;
  triggers: TriggerConfig[];
  constraints: ConstraintConfig[];
}
```

### Execution Lifecycle Integration

- **Pre-execution**: Widget preparation and validation
- **During execution**: Real-time updates and monitoring
- **Post-execution**: Result display and state persistence
- **Error handling**: Error visualization and recovery

### Workflow Events

```typescript
enum WorkflowEvent {
  NODE_STARTED = 'node-started',
  NODE_COMPLETED = 'node-completed',
  NODE_FAILED = 'node-failed',
  WORKFLOW_PAUSED = 'workflow-paused',
  WORKFLOW_RESUMED = 'workflow-resumed'
}
```

## 10. State Management & Persistence

### State Architecture

```typescript
interface WidgetState {
  id: string;
  type: string;
  data: any;
  ui: UIState;
  metadata: StateMetadata;
  version: number;
  timestamp: number;
}

interface UIState {
  visible: boolean;
  position: Position;
  size: Dimensions;
  focus: boolean;
  selection: any;
}
```

### Persistence Layer

```typescript
class StatePersistenceManager {
  save(widget: Widget): Promise<void>;
  load(widgetId: string): Promise<WidgetState>;
  backup(workflowId: string): Promise<void>;
  restore(workflowId: string, timestamp: number): Promise<void>;
  cleanup(retentionPolicy: RetentionPolicy): Promise<void>;
}
```

### State Synchronization

- **Local Storage**: Browser-based state caching
- **Session Storage**: Temporary state for current session
- **Remote Storage**: Cloud-based state persistence
- **Conflict Resolution**: Handling concurrent state changes

### State Recovery

```typescript
interface StateRecovery {
  autoSave: boolean;
  saveInterval: number;
  maxVersions: number;
  recoveryMode: 'auto' | 'manual' | 'prompt';
}
```

## Implementation Examples

### Real-time Chart Widget

```typescript
class RealTimeChartWidget extends CustomWidget {
  private chart: Chart;
  private dataStream: DataStream;
  
  async initialize(config: ChartConfig): Promise<void> {
    this.chart = new Chart(config.chartType, config.options);
    this.dataStream = new DataStream(config.dataSource);
    
    this.dataStream.subscribe((data) => {
      this.chart.addData(data);
      this.chart.render();
    });
  }
  
  render(container: Element): void {
    container.appendChild(this.chart.canvas);
  }
  
  update(data: any): void {
    this.chart.setData(data);
  }
}
```

### Interactive Form Widget

```typescript
class InteractiveFormWidget extends CustomWidget {
  private form: FormComponent;
  private validator: FormValidator;
  
  render(container: Element, config: FormConfig): void {
    this.form = new FormComponent(config.fields);
    this.validator = new FormValidator(config.validation);
    
    this.form.onSubmit((data) => {
      if (this.validator.validate(data)) {
        this.emitEvent({
          type: WidgetEventType.SUBMIT,
          data: data
        });
      }
    });
    
    container.appendChild(this.form.element);
  }
}
```

### Dashboard Widget

```typescript
class DashboardWidget extends CustomWidget {
  private panels: DashboardPanel[];
  private layout: GridLayout;
  
  render(container: Element, config: DashboardConfig): void {
    this.layout = new GridLayout(config.layout);
    this.panels = config.panels.map(panelConfig => 
      new DashboardPanel(panelConfig)
    );
    
    this.panels.forEach(panel => {
      this.layout.addPanel(panel);
      panel.onInteraction((event) => {
        this.handlePanelInteraction(event);
      });
    });
    
    container.appendChild(this.layout.element);
  }
}
```

## Security Considerations

- **Sandbox Isolation**: Widget execution in isolated contexts
- **Data Validation**: Input sanitization and validation
- **Access Control**: Permission-based widget capabilities
- **Audit Logging**: Widget action tracking and monitoring

## Testing & Quality Assurance

- **Unit Testing**: Individual widget component testing
- **Integration Testing**: Widget-workflow integration testing
- **Performance Testing**: Load and stress testing
- **Accessibility Testing**: WCAG compliance verification
- **Cross-browser Testing**: Compatibility across platforms

## Conclusion

The Live Widget System transforms Node Flow from a static workflow builder into a dynamic, interactive platform. By providing real-time updates, rich user interactions, and seamless workflow integration, widgets enable developers and AI agents to create sophisticated, responsive applications that provide immediate visual feedback and enable complex user interactions within the workflow execution context.
