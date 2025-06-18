// Core engine and managers
export { WidgetEngine, widgetEngine } from './core/WidgetEngine';
export { StreamManager, streamManager, createRealTimeStream, mergeStreams } from './core/StreamManager';
export { WidgetFactory, widgetFactory } from './core/WidgetFactory';
// Enhanced widget components
export { EnhancedChartWidget } from './components/enhanced/EnhancedChartWidget';
export { VirtualizedTableWidget } from './components/enhanced/VirtualizedTableWidget';
export { StreamingLogWidget } from './components/enhanced/StreamingLogWidget';
export { InteractiveFormWidget } from './components/enhanced/InteractiveFormWidget';
export { WidgetContainer } from './components/enhanced/WidgetContainer';
// Legacy components (for backwards compatibility)
export { ChartWidget } from './components/ChartWidget';
export { TableWidget } from './components/TableWidget';
export { LogWidget } from './components/LogWidget';
export { WidgetContainer as LegacyWidgetContainer } from './components/WidgetContainer';
// Streaming components (existing)
export { StreamingChart } from './components/StreamingChart';
export { StreamingTable } from './components/StreamingTable';
export { StreamingLogs } from './components/StreamingLogs';
// Hooks
export { useWidgetStream, emitToStream, emitBatchToStream, clearStream, getStreamStats, removeStream } from './hooks/useWidgetStream';
export { usePerformanceMonitor, useRenderPerformance, globalPerformanceTracker } from './hooks/usePerformanceMonitor';
// Streaming hooks (existing)
export { useStreamData, useChartStream, useTableStream, useLogStream, useCombinedStreams } from './hooks/useStreamData';
// Widget factory helpers
export { createChartWidget, createTableWidget, createLogWidget, createFormWidget, createChartComponent, createTableComponent, createLogComponent, createFormComponent } from './core/WidgetFactory';
