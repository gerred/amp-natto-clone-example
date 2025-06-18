import { useEffect, useState, useRef, useMemo } from 'react';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, filter, catchError, retry, takeUntil, scan, bufferTime, share } from 'rxjs/operators';
export function useStreamData(streamId, config = {}) {
    const [state, setState] = useState({
        data: [],
        isConnected: false,
        error: null,
        metrics: {
            messageCount: 0,
            averageLatency: 0,
            lastUpdate: 0
        }
    });
    const destroySubject = useRef(new Subject());
    const streamSubject = useRef(new BehaviorSubject([]));
    const { bufferSize = 1000, updateInterval = 16, // ~60fps
    errorRetries = 3, enableBackpressure = true } = config;
    // Create the stream processing pipeline
    const streamObservable = useMemo(() => {
        // This would connect to the actual stream engine
        // For now, creating a mock observable that simulates real-time data
        const mockStream = new Observable(subscriber => {
            let messageCount = 0;
            const interval = setInterval(() => {
                const message = {
                    timestamp: Date.now(),
                    value: Math.random() * 100,
                    metadata: { id: ++messageCount }
                };
                subscriber.next(message);
            }, 100); // 10 messages per second
            return () => clearInterval(interval);
        });
        return mockStream.pipe(
        // Buffer messages to prevent UI blocking
        bufferTime(updateInterval), filter(messages => messages.length > 0), 
        // Apply backpressure if enabled
        ...(enableBackpressure ? [
            map(messages => {
                // Drop older messages if buffer is full
                if (messages.length > bufferSize / 10) {
                    return messages.slice(-bufferSize / 10);
                }
                return messages;
            })
        ] : []), 
        // Error handling with retry
        catchError(error => {
            setState(prev => ({ ...prev, error: error, isConnected: false }));
            throw error;
        }), retry(errorRetries), 
        // Update accumulated data
        scan((acc, newMessages) => {
            const combined = [...acc, ...newMessages];
            // Keep only recent messages within buffer size
            return combined.slice(-bufferSize);
        }, []), 
        // Share the stream to prevent multiple subscriptions
        share(), 
        // Stop when component unmounts
        takeUntil(destroySubject.current));
    }, [streamId, bufferSize, updateInterval, errorRetries, enableBackpressure]);
    useEffect(() => {
        const subscription = streamObservable.subscribe({
            next: (data) => {
                const now = Date.now();
                const latency = data.length > 0 ? now - data[data.length - 1].timestamp : 0;
                setState(prev => ({
                    ...prev,
                    data,
                    isConnected: true,
                    error: null,
                    metrics: {
                        messageCount: prev.metrics.messageCount + data.length,
                        averageLatency: (prev.metrics.averageLatency * 0.9) + (latency * 0.1),
                        lastUpdate: now
                    }
                }));
                streamSubject.current.next(data);
            },
            error: (error) => {
                setState(prev => ({
                    ...prev,
                    error: error,
                    isConnected: false
                }));
            }
        });
        setState(prev => ({ ...prev, isConnected: true }));
        return () => {
            subscription.unsubscribe();
            destroySubject.current.next();
        };
    }, [streamObservable]);
    useEffect(() => {
        return () => {
            destroySubject.current.complete();
        };
    }, []);
    return state;
}
export function useChartStream(streamId, config = {}) {
    const { maxDataPoints = 100, ...streamConfig } = config;
    const baseState = useStreamData(streamId, streamConfig);
    const chartData = useMemo(() => {
        return baseState.data
            .filter(item => typeof item.value === 'number' || (typeof item.value === 'object' && 'x' in item.value))
            .slice(-maxDataPoints);
    }, [baseState.data, maxDataPoints]);
    return {
        ...baseState,
        chartData
    };
}
export function useTableStream(streamId, config = {}) {
    const { pageSize = 50, ...streamConfig } = config;
    const baseState = useStreamData(streamId, streamConfig);
    const [currentPage, setCurrentPage] = useState(0);
    const tableData = useMemo(() => {
        const start = currentPage * pageSize;
        return baseState.data
            .filter(item => typeof item.value === 'object' && item.value !== null)
            .slice(start, start + pageSize);
    }, [baseState.data, currentPage, pageSize]);
    const totalPages = useMemo(() => {
        return Math.ceil(baseState.data.length / pageSize);
    }, [baseState.data.length, pageSize]);
    const setPage = (page) => {
        setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    };
    return {
        ...baseState,
        tableData,
        currentPage,
        totalPages,
        setPage
    };
}
export function useLogStream(streamId, config = {}) {
    const { logLevel = 'info', maxLogs = 1000, ...streamConfig } = config;
    const baseState = useStreamData(streamId, streamConfig);
    const [selectedLogLevel, setSelectedLogLevel] = useState(logLevel);
    const logLevels = ['debug', 'info', 'warn', 'error'];
    const levelPriority = { debug: 0, info: 1, warn: 2, error: 3 };
    const filteredLogs = useMemo(() => {
        const minPriority = levelPriority[selectedLogLevel];
        return baseState.data
            .filter(item => typeof item.value === 'object' &&
            item.value !== null &&
            'level' in item.value &&
            levelPriority[item.value.level] >= minPriority)
            .slice(-maxLogs);
    }, [baseState.data, selectedLogLevel, maxLogs]);
    return {
        ...baseState,
        filteredLogs,
        logLevels,
        setLogLevel: setSelectedLogLevel
    };
}
// Advanced hook for multiple stream combination
export function useCombinedStreams(streamIds, config = {}) {
    const [combinedState, setCombinedState] = useState({
        combinedData: new Map(),
        isAllConnected: false,
        errors: new Map(),
        totalMetrics: {
            totalMessages: 0,
            averageLatency: 0,
            connectionCount: 0
        }
    });
    // Use individual streams
    const streamStates = streamIds.map(id => useStreamData(id, config));
    useEffect(() => {
        const combinedData = new Map();
        const errors = new Map();
        let totalMessages = 0;
        let totalLatency = 0;
        let connectedCount = 0;
        streamIds.forEach((id, index) => {
            const state = streamStates[index];
            combinedData.set(id, state.data);
            if (state.error) {
                errors.set(id, state.error);
            }
            if (state.isConnected) {
                connectedCount++;
            }
            totalMessages += state.metrics.messageCount;
            totalLatency += state.metrics.averageLatency;
        });
        setCombinedState({
            combinedData,
            isAllConnected: connectedCount === streamIds.length,
            errors,
            totalMetrics: {
                totalMessages,
                averageLatency: streamIds.length > 0 ? totalLatency / streamIds.length : 0,
                connectionCount: connectedCount
            }
        });
    }, [streamStates, streamIds]);
    return combinedState;
}
