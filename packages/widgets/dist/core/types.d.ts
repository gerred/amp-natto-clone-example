import { ReactNode } from 'react';
import { Observable } from 'rxjs';
export interface Widget {
    id: string;
    type: WidgetType;
    nodeId: string;
    config: WidgetConfig;
    state: WidgetState;
    lifecycle: WidgetLifecycle;
}
export interface WidgetType {
    name: string;
    version: string;
    renderer: WidgetRenderer;
    schema: JSONSchema;
    capabilities: WidgetCapabilities;
}
export interface WidgetConfig {
    [key: string]: any;
}
export interface WidgetState {
    id: string;
    type: string;
    data: any;
    ui: UIState;
    metadata: StateMetadata;
    version: number;
    timestamp: number;
}
export interface UIState {
    visible: boolean;
    position: Position;
    size: Dimensions;
    focus: boolean;
    selection: any;
    collapsed?: boolean;
    minimized?: boolean;
}
export interface StateMetadata {
    created: number;
    modified: number;
    author?: string;
    tags?: string[];
}
export interface Position {
    x: number;
    y: number;
    z?: number;
}
export interface Dimensions {
    width: number;
    height: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
}
export declare enum WidgetLifecycle {
    INITIALIZING = "initializing",
    MOUNTING = "mounting",
    ACTIVE = "active",
    UPDATING = "updating",
    PAUSED = "paused",
    DESTROYING = "destroying",
    DESTROYED = "destroyed"
}
export interface WidgetLifecycleHooks {
    onInitialize?(config: WidgetConfig): void;
    onMount?(container: Element): void;
    onUpdate?(data: any): void;
    onPause?(): void;
    onResume?(): void;
    onDestroy?(): void;
}
export interface WidgetRenderer {
    render(container: Element, data: any, config: WidgetConfig): void;
    update(data: any): void;
    destroy(): void;
}
export interface WidgetCapabilities {
    interactive: boolean;
    realtime: boolean;
    resizable: boolean;
    configurable: boolean;
    exportable: boolean;
}
export interface JSONSchema {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean;
}
export interface DataBinding {
    source: DataSource;
    target: WidgetProperty;
    transform?: TransformFunction;
    updateMode: 'push' | 'pull' | 'bidirectional';
    throttle?: number;
}
export interface DataSource {
    type: 'node-output' | 'workflow-variable' | 'external-api' | 'stream';
    path: string;
    subscription: SubscriptionConfig;
}
export interface WidgetProperty {
    path: string;
    type: string;
    validation?: ValidationRule[];
}
export interface SubscriptionConfig {
    throttle?: number;
    debounce?: number;
    buffer?: number;
    maxRetries?: number;
    retryDelay?: number;
}
export type TransformFunction = (data: any) => any;
export interface ValidationRule {
    type: 'required' | 'type' | 'range' | 'pattern' | 'custom';
    value?: any;
    message?: string;
    validator?: (value: any) => boolean;
}
export interface WidgetEvent {
    type: WidgetEventType;
    source: Widget;
    target?: string;
    data: any;
    timestamp: number;
    propagate: boolean;
}
export declare enum WidgetEventType {
    CLICK = "click",
    CHANGE = "change",
    SUBMIT = "submit",
    SELECT = "select",
    HOVER = "hover",
    FOCUS = "focus",
    BLUR = "blur",
    RESIZE = "resize",
    MOVE = "move",
    CUSTOM = "custom"
}
export type EventHandler = (event: WidgetEvent) => void;
export interface PerformanceMetrics {
    renderTime: number;
    updateFrequency: number;
    memoryUsage: number;
    eventLatency: number;
    throughput: number;
    fps?: number;
}
export interface PerformanceConfig {
    virtualizeThreshold: number;
    maxUpdateFrequency: number;
    enableProfiling: boolean;
    memoryWarningThreshold: number;
}
export interface StreamData {
    timestamp: number;
    value: unknown;
    metadata?: Record<string, unknown>;
    sequenceId?: number;
}
export interface StreamConfig {
    id: string;
    bufferSize?: number;
    windowSize?: number;
    compression?: boolean;
    encryption?: boolean;
}
export interface DataSubscription {
    id: string;
    streamId: string;
    observable: Observable<StreamData>;
    config: SubscriptionConfig;
    isActive: boolean;
}
export interface ViewContainer {
    id: string;
    nodeId: string;
    dimensions: ContainerDimensions;
    viewport: ViewportConfig;
    widgets: Widget[];
    layout: LayoutManager;
}
export interface ContainerDimensions {
    width: number;
    height: number;
    aspectRatio?: number;
    resizable: boolean;
    constraints: SizeConstraints;
}
export interface SizeConstraints {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: number;
}
export interface ViewportConfig {
    scrollable: boolean;
    zoomable: boolean;
    pannable: boolean;
    initialZoom?: number;
    minZoom?: number;
    maxZoom?: number;
}
export interface LayoutManager {
    type: 'grid' | 'stack' | 'flow' | 'custom';
    config: LayoutConfig;
    addWidget(widget: Widget): void;
    removeWidget(widgetId: string): void;
    updateLayout(): void;
}
export interface LayoutConfig {
    columns?: number;
    rows?: number;
    gap?: number;
    padding?: number;
    alignment?: 'start' | 'center' | 'end' | 'stretch';
}
export interface WidgetFactory {
    create(type: string, config: WidgetConfig): Widget;
    register(type: WidgetType): void;
    unregister(typeName: string): void;
    getAvailable(): WidgetType[];
}
export interface WidgetProps {
    id: string;
    type?: string;
    title?: string;
    streamId?: string;
    config?: WidgetConfig;
    data?: any;
    onEvent?: (event: WidgetEvent) => void;
    performance?: PerformanceConfig;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
}
export interface WidgetContainerProps extends WidgetProps {
    resizable?: boolean;
    collapsible?: boolean;
    minimizable?: boolean;
    dragHandle?: boolean;
    toolbar?: ReactNode;
    footer?: ReactNode;
    loading?: boolean;
    error?: Error | string;
}
