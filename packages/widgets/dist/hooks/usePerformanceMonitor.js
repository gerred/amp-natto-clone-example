import { useCallback, useEffect, useRef, useState } from 'react';
export function usePerformanceMonitor(widgetId) {
    const [metrics, setMetrics] = useState(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    // Refs for tracking
    const frameCountRef = useRef(0);
    const lastFrameTimeRef = useRef(performance.now());
    const fpsHistoryRef = useRef([]);
    const renderCountRef = useRef(0);
    const processingTimesRef = useRef([]);
    const monitoringIntervalRef = useRef(null);
    const animationFrameRef = useRef(null);
    // Initialize metrics
    const initializeMetrics = useCallback(() => ({
        renderTime: 0,
        updateFrequency: 0,
        memoryUsage: 0,
        eventLatency: 0,
        throughput: 0,
        fps: 0,
        frameTime: 0,
        dataProcessingTime: 0,
        componentsCount: 1,
        reRenderCount: 0,
        lastUpdateTime: performance.now()
    }), []);
    // FPS monitoring using RAF
    const measureFPS = useCallback(() => {
        const now = performance.now();
        const deltaTime = now - lastFrameTimeRef.current;
        frameCountRef.current++;
        if (deltaTime >= 1000) { // Update every second
            const fps = (frameCountRef.current * 1000) / deltaTime;
            fpsHistoryRef.current.push(fps);
            // Keep only last 10 seconds of history
            if (fpsHistoryRef.current.length > 10) {
                fpsHistoryRef.current.shift();
            }
            frameCountRef.current = 0;
            lastFrameTimeRef.current = now;
            // Update metrics
            setMetrics(prev => prev ? {
                ...prev,
                fps,
                frameTime: deltaTime / 1000,
                lastUpdateTime: now
            } : null);
        }
        if (isMonitoring) {
            animationFrameRef.current = requestAnimationFrame(measureFPS);
        }
    }, [isMonitoring]);
    // Memory usage estimation
    const estimateMemoryUsage = useCallback(() => {
        if ('memory' in performance) {
            const memInfo = performance.memory;
            return memInfo.usedJSHeapSize || 0;
        }
        // Fallback estimation
        return window.history.length * 1024; // Rough estimate
    }, []);
    // Record specific metrics
    const recordMetric = useCallback((metric, value) => {
        setMetrics(prev => prev ? {
            ...prev,
            [metric]: value,
            lastUpdateTime: performance.now()
        } : null);
    }, []);
    // Record data processing time
    const recordDataProcessingTime = useCallback((time) => {
        processingTimesRef.current.push(time);
        // Keep only last 100 measurements
        if (processingTimesRef.current.length > 100) {
            processingTimesRef.current.shift();
        }
        const avgProcessingTime = processingTimesRef.current.reduce((sum, t) => sum + t, 0) / processingTimesRef.current.length;
        recordMetric('dataProcessingTime', avgProcessingTime);
    }, [recordMetric]);
    // Record render
    const recordRender = useCallback(() => {
        renderCountRef.current++;
        const now = performance.now();
        setMetrics(prev => prev ? {
            ...prev,
            reRenderCount: renderCountRef.current,
            renderTime: now,
            lastUpdateTime: now
        } : null);
    }, []);
    // Get average metrics over time
    const getAverageMetrics = useCallback(() => {
        if (!metrics)
            return null;
        const avgFPS = fpsHistoryRef.current.length > 0
            ? fpsHistoryRef.current.reduce((sum, fps) => sum + fps, 0) / fpsHistoryRef.current.length
            : 0;
        const avgProcessingTime = processingTimesRef.current.length > 0
            ? processingTimesRef.current.reduce((sum, t) => sum + t, 0) / processingTimesRef.current.length
            : 0;
        return {
            ...metrics,
            fps: avgFPS,
            dataProcessingTime: avgProcessingTime
        };
    }, [metrics]);
    // Start monitoring
    const startMonitoring = useCallback(() => {
        if (isMonitoring)
            return;
        setIsMonitoring(true);
        setMetrics(initializeMetrics());
        // Start FPS monitoring
        animationFrameRef.current = requestAnimationFrame(measureFPS);
        // Start periodic monitoring
        monitoringIntervalRef.current = window.setInterval(() => {
            const memoryUsage = estimateMemoryUsage();
            const now = performance.now();
            setMetrics(prev => prev ? {
                ...prev,
                memoryUsage,
                updateFrequency: prev.updateFrequency + 1,
                throughput: prev.throughput + 1,
                lastUpdateTime: now
            } : null);
        }, 1000);
    }, [isMonitoring, initializeMetrics, measureFPS, estimateMemoryUsage]);
    // Stop monitoring
    const stopMonitoring = useCallback(() => {
        setIsMonitoring(false);
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (monitoringIntervalRef.current) {
            clearInterval(monitoringIntervalRef.current);
            monitoringIntervalRef.current = null;
        }
    }, []);
    // Reset metrics
    const resetMetrics = useCallback(() => {
        frameCountRef.current = 0;
        renderCountRef.current = 0;
        fpsHistoryRef.current = [];
        processingTimesRef.current = [];
        lastFrameTimeRef.current = performance.now();
        if (isMonitoring) {
            setMetrics(initializeMetrics());
        }
        else {
            setMetrics(null);
        }
    }, [isMonitoring, initializeMetrics]);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMonitoring();
        };
    }, [stopMonitoring]);
    // Log performance warnings
    useEffect(() => {
        if (!metrics || !isMonitoring)
            return;
        const warnings = [];
        if (metrics.fps && metrics.fps < 30) {
            warnings.push(`Low FPS detected: ${metrics.fps.toFixed(1)}`);
        }
        if (metrics.dataProcessingTime && metrics.dataProcessingTime > 16) {
            warnings.push(`Slow data processing: ${metrics.dataProcessingTime.toFixed(1)}ms`);
        }
        if (metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
            warnings.push(`High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
        }
        if (warnings.length > 0) {
            console.warn(`Performance warnings for widget ${widgetId}:`, warnings);
        }
    }, [metrics, isMonitoring, widgetId]);
    return {
        metrics,
        startMonitoring,
        stopMonitoring,
        recordMetric,
        recordDataProcessingTime,
        recordRender,
        getAverageMetrics,
        resetMetrics,
        isMonitoring
    };
}
// Hook for component-level performance monitoring
export function useRenderPerformance(componentName) {
    const renderCountRef = useRef(0);
    const renderTimesRef = useRef([]);
    useEffect(() => {
        const startTime = performance.now();
        renderCountRef.current++;
        return () => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            renderTimesRef.current.push(renderTime);
            if (renderTimesRef.current.length > 100) {
                renderTimesRef.current.shift();
            }
            // Log slow renders
            if (renderTime > 16) { // Longer than one frame at 60fps
                console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
            }
        };
    });
    const getAverageRenderTime = useCallback(() => {
        if (renderTimesRef.current.length === 0)
            return 0;
        return renderTimesRef.current.reduce((sum, time) => sum + time, 0) / renderTimesRef.current.length;
    }, []);
    return {
        renderCount: renderCountRef.current,
        averageRenderTime: getAverageRenderTime(),
        lastRenderTimes: renderTimesRef.current.slice(-10)
    };
}
// Global performance tracker for all widgets
class GlobalPerformanceTracker {
    widgets = new Map();
    isTracking = false;
    startTracking() {
        this.isTracking = true;
    }
    stopTracking() {
        this.isTracking = false;
        this.widgets.clear();
    }
    updateWidget(widgetId, metrics) {
        if (this.isTracking) {
            this.widgets.set(widgetId, metrics);
        }
    }
    removeWidget(widgetId) {
        this.widgets.delete(widgetId);
    }
    getGlobalMetrics() {
        const metrics = Array.from(this.widgets.values());
        if (metrics.length === 0) {
            return {
                totalWidgets: 0,
                averageFPS: 0,
                totalMemoryUsage: 0,
                slowestWidget: null
            };
        }
        const avgFPS = metrics.reduce((sum, m) => sum + (m.fps || 0), 0) / metrics.length;
        const totalMemory = metrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0);
        // Find slowest widget
        let slowestWidget = null;
        let slowestFPS = Infinity;
        this.widgets.forEach((metrics, widgetId) => {
            if (metrics.fps && metrics.fps < slowestFPS) {
                slowestFPS = metrics.fps;
                slowestWidget = widgetId;
            }
        });
        return {
            totalWidgets: metrics.length,
            averageFPS: avgFPS,
            totalMemoryUsage: totalMemory,
            slowestWidget
        };
    }
}
export const globalPerformanceTracker = new GlobalPerformanceTracker();
