import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil, throttleTime } from 'rxjs/operators';
import { 
  Widget, 
  WidgetState, 
  WidgetEvent, 
  WidgetEventType, 
  WidgetLifecycle, 
  DataBinding, 
  StreamData, 
  PerformanceMetrics,
  EventHandler,
  DataSubscription
} from './types';

export class WidgetEngine {
  private widgets = new Map<string, Widget>();
  private widgetStates = new Map<string, BehaviorSubject<WidgetState>>();
  private eventStreams = new Map<string, Subject<WidgetEvent>>();
  private dataSubscriptions = new Map<string, DataSubscription>();
  private performanceMetrics = new Map<string, PerformanceMetrics>();
  private destroyed$ = new Subject<void>();

  constructor() {
    this.setupPerformanceMonitoring();
  }

  // Widget Lifecycle Management
  createWidget(config: Partial<Widget>): Widget {
    const widget: Widget = {
      id: config.id || this.generateId(),
      type: config.type!,
      nodeId: config.nodeId!,
      config: config.config || {},
      state: this.createInitialState(config.id || this.generateId()),
      lifecycle: WidgetLifecycle.INITIALIZING
    };

    this.widgets.set(widget.id, widget);
    this.widgetStates.set(widget.id, new BehaviorSubject(widget.state));
    this.eventStreams.set(widget.id, new Subject<WidgetEvent>());

    this.transitionLifecycle(widget.id, WidgetLifecycle.MOUNTING);
    
    return widget;
  }

  destroyWidget(widgetId: string): void {
    const widget = this.widgets.get(widgetId);
    if (!widget) return;

    this.transitionLifecycle(widgetId, WidgetLifecycle.DESTROYING);
    
    // Clean up subscriptions
    const subscription = this.dataSubscriptions.get(widgetId);
    if (subscription) {
      subscription.isActive = false;
      subscription.observable.pipe(takeUntil(this.destroyed$)).subscribe().unsubscribe();
      this.dataSubscriptions.delete(widgetId);
    }

    // Clean up event streams
    const eventStream = this.eventStreams.get(widgetId);
    if (eventStream) {
      eventStream.complete();
      this.eventStreams.delete(widgetId);
    }

    // Clean up state
    const stateStream = this.widgetStates.get(widgetId);
    if (stateStream) {
      stateStream.complete();
      this.widgetStates.delete(widgetId);
    }

    this.widgets.delete(widgetId);
    this.performanceMetrics.delete(widgetId);
    
    this.transitionLifecycle(widgetId, WidgetLifecycle.DESTROYED);
  }

  // State Management
  getWidgetState(widgetId: string): WidgetState | undefined {
    return this.widgetStates.get(widgetId)?.value;
  }

  updateWidgetState(widgetId: string, updates: Partial<WidgetState>): void {
    const stateStream = this.widgetStates.get(widgetId);
    if (!stateStream) return;

    const currentState = stateStream.value;
    const newState: WidgetState = {
      ...currentState,
      ...updates,
      version: currentState.version + 1,
      timestamp: Date.now()
    };

    stateStream.next(newState);
    this.transitionLifecycle(widgetId, WidgetLifecycle.UPDATING);
  }

  subscribeToWidgetState(widgetId: string): Observable<WidgetState> | undefined {
    return this.widgetStates.get(widgetId)?.asObservable();
  }

  // Data Binding
  bindData(widgetId: string, binding: DataBinding): void {
    const widget = this.widgets.get(widgetId);
    if (!widget) return;

    const dataStream = this.createDataStream(binding);
    const subscription: DataSubscription = {
      id: this.generateId(),
      streamId: binding.source.path,
      observable: dataStream,
      config: binding.source.subscription,
      isActive: true
    };

    this.dataSubscriptions.set(widgetId, subscription);

    // Apply throttling/debouncing based on config
    let processedStream = dataStream;
    if (binding.throttle) {
      processedStream = processedStream.pipe(throttleTime(binding.throttle));
    }
    if (binding.source.subscription.debounce) {
      processedStream = processedStream.pipe(debounceTime(binding.source.subscription.debounce));
    }

    // Subscribe to data updates
    processedStream.pipe(
      takeUntil(this.destroyed$),
      filter(() => subscription.isActive),
      map(data => binding.transform ? binding.transform(data) : data),
      distinctUntilChanged()
    ).subscribe({
      next: (data) => {
        this.updateWidgetData(widgetId, data);
        this.recordPerformanceMetric(widgetId, 'updateFrequency');
      },
      error: (error) => {
        this.emitEvent(widgetId, {
          type: WidgetEventType.CUSTOM,
          source: widget,
          data: { error, type: 'data-error' },
          timestamp: Date.now(),
          propagate: false
        });
      }
    });
  }

  // Event System
  addEventListener(widgetId: string, eventType: WidgetEventType, handler: EventHandler): void {
    const eventStream = this.eventStreams.get(widgetId);
    if (!eventStream) return;

    eventStream.pipe(
      filter(event => event.type === eventType),
      takeUntil(this.destroyed$)
    ).subscribe(handler);
  }

  emitEvent(widgetId: string, event: Partial<WidgetEvent>): void {
    const widget = this.widgets.get(widgetId);
    const eventStream = this.eventStreams.get(widgetId);
    if (!widget || !eventStream) return;

    const fullEvent: WidgetEvent = {
      type: event.type || WidgetEventType.CUSTOM,
      source: widget,
      target: event.target || widgetId,
      data: event.data,
      timestamp: event.timestamp || Date.now(),
      propagate: event.propagate ?? true
    };

    eventStream.next(fullEvent);

    // Propagate to parent if needed
    if (fullEvent.propagate) {
      this.propagateEvent(fullEvent);
    }
  }

  // Performance Monitoring
  getPerformanceMetrics(widgetId: string): PerformanceMetrics | undefined {
    return this.performanceMetrics.get(widgetId);
  }

  recordPerformanceMetric(widgetId: string, metric: keyof PerformanceMetrics, value?: number): void {
    const current = this.performanceMetrics.get(widgetId) || this.createInitialMetrics();
    const timestamp = Date.now();
    
    switch (metric) {
      case 'renderTime':
        current.renderTime = value || timestamp;
        break;
      case 'updateFrequency':
        current.updateFrequency = current.updateFrequency + 1;
        break;
      case 'eventLatency':
        current.eventLatency = value || 0;
        break;
      case 'memoryUsage':
        current.memoryUsage = value || this.estimateMemoryUsage(widgetId);
        break;
      case 'throughput':
        current.throughput = value || current.throughput + 1;
        break;
    }

    this.performanceMetrics.set(widgetId, current);
  }

  // Utility Methods
  private generateId(): string {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createInitialState(id: string): WidgetState {
    return {
      id,
      type: '',
      data: null,
      ui: {
        visible: true,
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
        focus: false,
        selection: null
      },
      metadata: {
        created: Date.now(),
        modified: Date.now()
      },
      version: 0,
      timestamp: Date.now()
    };
  }

  private createInitialMetrics(): PerformanceMetrics {
    return {
      renderTime: 0,
      updateFrequency: 0,
      memoryUsage: 0,
      eventLatency: 0,
      throughput: 0
    };
  }

  private transitionLifecycle(widgetId: string, lifecycle: WidgetLifecycle): void {
    const widget = this.widgets.get(widgetId);
    if (widget) {
      widget.lifecycle = lifecycle;
      this.widgets.set(widgetId, widget);
    }
  }

  private createDataStream(binding: DataBinding): Observable<StreamData> {
    // This would connect to the actual data source
    // For now, return a placeholder observable
    return new Observable<StreamData>(subscriber => {
      // Implementation would depend on the data source type
      // This is a placeholder for the actual streaming implementation
      const interval = setInterval(() => {
        subscriber.next({
          timestamp: Date.now(),
          value: Math.random() * 100,
          metadata: { source: binding.source.path }
        });
      }, 1000);

      return () => clearInterval(interval);
    });
  }

  private updateWidgetData(widgetId: string, data: any): void {
    const currentState = this.getWidgetState(widgetId);
    if (currentState) {
      this.updateWidgetState(widgetId, {
        data,
        metadata: {
          ...currentState.metadata,
          modified: Date.now()
        }
      });
    }
  }

  private propagateEvent(event: WidgetEvent): void {
    // Implementation for event propagation to parent containers
    // This would notify parent widgets or the workflow system
    console.log('Propagating event:', event);
  }

  private estimateMemoryUsage(widgetId: string): number {
    // Estimate memory usage for the widget
    // This is a simplified implementation
    const widget = this.widgets.get(widgetId);
    const state = this.getWidgetState(widgetId);
    
    if (!widget || !state) return 0;
    
    // Rough estimation based on serialized size
    const serialized = JSON.stringify({ widget, state });
    return serialized.length * 2; // 2 bytes per character approximation
  }

  private setupPerformanceMonitoring(): void {
    // Setup periodic performance monitoring
    setInterval(() => {
      this.widgets.forEach((_, widgetId) => {
        this.recordPerformanceMetric(widgetId, 'memoryUsage');
      });
    }, 5000); // Check every 5 seconds
  }

  destroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    
    // Clean up all widgets
    Array.from(this.widgets.keys()).forEach(widgetId => {
      this.destroyWidget(widgetId);
    });
    
    this.widgets.clear();
    this.widgetStates.clear();
    this.eventStreams.clear();
    this.dataSubscriptions.clear();
    this.performanceMetrics.clear();
  }
}

// Singleton instance
export const widgetEngine = new WidgetEngine();
