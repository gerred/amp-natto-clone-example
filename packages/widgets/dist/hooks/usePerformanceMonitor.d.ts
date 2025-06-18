import { PerformanceMetrics } from '../core/types';
interface ExtendedPerformanceMetrics extends PerformanceMetrics {
    fps?: number;
    frameTime?: number;
    dataProcessingTime?: number;
    componentsCount?: number;
    reRenderCount?: number;
    lastUpdateTime?: number;
}
interface PerformanceMonitorHook {
    metrics: ExtendedPerformanceMetrics | null;
    startMonitoring: () => void;
    stopMonitoring: () => void;
    recordMetric: (metric: keyof ExtendedPerformanceMetrics, value: number) => void;
    recordDataProcessingTime: (time: number) => void;
    recordRender: () => void;
    getAverageMetrics: () => ExtendedPerformanceMetrics | null;
    resetMetrics: () => void;
    isMonitoring: boolean;
}
export declare function usePerformanceMonitor(widgetId: string): PerformanceMonitorHook;
export declare function useRenderPerformance(componentName: string): {
    renderCount: number;
    averageRenderTime: number;
    lastRenderTimes: number[];
};
declare class GlobalPerformanceTracker {
    private widgets;
    private isTracking;
    startTracking(): void;
    stopTracking(): void;
    updateWidget(widgetId: string, metrics: ExtendedPerformanceMetrics): void;
    removeWidget(widgetId: string): void;
    getGlobalMetrics(): {
        totalWidgets: number;
        averageFPS: number;
        totalMemoryUsage: number;
        slowestWidget: string | null;
    };
}
export declare const globalPerformanceTracker: GlobalPerformanceTracker;
export {};
