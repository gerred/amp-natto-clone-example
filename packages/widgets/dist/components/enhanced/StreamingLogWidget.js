import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { debounce } from 'lodash';
import { WidgetContainer } from './WidgetContainer';
import { useWidgetStream } from '../../hooks/useWidgetStream';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
export const StreamingLogWidget = ({ id, title, streamId, config = {}, logConfig, realTimeUpdate = true, maxEntries = 10000, onEvent, ...props }) => {
    const containerRef = useRef(null);
    const listRef = useRef(null);
    const { startMonitoring, stopMonitoring, metrics } = usePerformanceMonitor(id);
    // State management
    const [filters, setFilters] = useState({
        levels: new Set(),
        sources: new Set(),
        keywords: ''
    });
    const [autoScroll, setAutoScroll] = useState(true);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 400 });
    const [expandedEntries, setExpandedEntries] = useState(new Set());
    // Stream data
    const streamData = useWidgetStream(streamId, {
        throttle: realTimeUpdate ? 16 : 100, // 60fps for real-time
        maxBuffer: maxEntries,
    });
    // Log configuration with defaults
    const finalLogConfig = useMemo(() => {
        const defaultConfig = {
            maxEntries: 10000,
            autoScroll: true,
            showTimestamp: true,
            showLevel: true,
            showSource: true,
            dateFormat: 'HH:mm:ss.SSS',
            levelColors: {
                trace: '#6b7280',
                debug: '#3b82f6',
                info: '#10b981',
                warn: '#f59e0b',
                error: '#ef4444',
                fatal: '#dc2626'
            },
            filters: {
                levels: [],
                sources: [],
                keywords: []
            },
            grouping: {
                enabled: false,
                key: 'source',
                maxGroups: 50
            },
            performance: {
                virtualization: true,
                batchSize: 100,
                updateInterval: 16
            }
        };
        return { ...defaultConfig, ...logConfig, ...config };
    }, [logConfig, config]);
    // Transform stream data to log entries
    const logEntries = useMemo(() => {
        if (!streamData || streamData.length === 0)
            return [];
        let entries = streamData.map((item, index) => {
            const value = item.value;
            // Handle different log entry formats
            if (typeof value === 'object' && value !== null && 'level' in value && 'message' in value) {
                return {
                    _id: index,
                    _timestamp: item.timestamp,
                    _sequenceId: item.sequenceId,
                    ...value
                };
            }
            // Convert simple values to log entries
            return {
                _id: index,
                _timestamp: item.timestamp,
                _sequenceId: item.sequenceId,
                timestamp: item.timestamp,
                level: 'info',
                message: String(value),
                source: 'stream'
            };
        });
        // Apply filters
        if (filters.levels.size > 0) {
            entries = entries.filter(entry => filters.levels.has(entry.level));
        }
        if (filters.sources.size > 0) {
            entries = entries.filter(entry => entry.source && filters.sources.has(entry.source));
        }
        if (filters.keywords.trim()) {
            const keywords = filters.keywords.toLowerCase().split(' ').filter(k => k.length > 0);
            entries = entries.filter(entry => {
                const searchText = `${entry.message} ${entry.source || ''} ${JSON.stringify(entry.details || '')}`.toLowerCase();
                return keywords.some(keyword => searchText.includes(keyword));
            });
        }
        // Limit entries for performance
        if (entries.length > finalLogConfig.maxEntries) {
            entries = entries.slice(-finalLogConfig.maxEntries);
        }
        // Performance metrics are handled by the hook
        return entries;
    }, [streamData, filters, finalLogConfig.maxEntries, metrics]);
    // Auto-scroll to bottom when new entries arrive
    useEffect(() => {
        if (autoScroll && listRef.current && logEntries.length > 0) {
            listRef.current.scrollToItem(logEntries.length - 1, 'end');
        }
    }, [logEntries.length, autoScroll]);
    // Format timestamp
    const formatTimestamp = useCallback((timestamp) => {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }, []);
    // Get unique values for filters
    const availableFilters = useMemo(() => {
        const levels = new Set();
        const sources = new Set();
        logEntries.forEach(entry => {
            levels.add(entry.level);
            if (entry.source)
                sources.add(entry.source);
        });
        return {
            levels: Array.from(levels),
            sources: Array.from(sources)
        };
    }, [logEntries]);
    // Event handlers
    const handleLevelFilter = useCallback((level, enabled) => {
        setFilters(prev => {
            const newLevels = new Set(prev.levels);
            if (enabled) {
                newLevels.add(level);
            }
            else {
                newLevels.delete(level);
            }
            return { ...prev, levels: newLevels };
        });
    }, []);
    const handleSourceFilter = useCallback((source, enabled) => {
        setFilters(prev => {
            const newSources = new Set(prev.sources);
            if (enabled) {
                newSources.add(source);
            }
            else {
                newSources.delete(source);
            }
            return { ...prev, sources: newSources };
        });
    }, []);
    const handleKeywordFilter = useCallback(debounce((keywords) => {
        setFilters(prev => ({ ...prev, keywords }));
    }, 300), []);
    const handleEntryClick = useCallback((entryId) => {
        setExpandedEntries(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entryId)) {
                newSet.delete(entryId);
            }
            else {
                newSet.add(entryId);
            }
            return newSet;
        });
        if (onEvent) {
            onEvent({
                type: 'click',
                source: { id },
                data: { entryId, expanded: !expandedEntries.has(entryId) },
                timestamp: Date.now(),
                propagate: false
            });
        }
    }, [expandedEntries, onEvent, id]);
    // Resize observer
    useEffect(() => {
        if (!containerRef.current)
            return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerSize({ width, height });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);
    // Performance monitoring
    useEffect(() => {
        startMonitoring();
        return () => stopMonitoring();
    }, [startMonitoring, stopMonitoring]);
    // Log entry component
    const LogEntryComponent = React.memo(({ index, style }) => {
        const entry = logEntries[index];
        if (!entry)
            return null;
        const isExpanded = expandedEntries.has(entry._id);
        const levelColor = finalLogConfig.levelColors?.[entry.level] || '#6b7280';
        return (_jsxs("div", { style: style, className: `log-entry level-${entry.level} ${isExpanded ? 'expanded' : ''}`, onClick: () => handleEntryClick(entry._id), children: [_jsxs("div", { className: "log-entry-main", children: [finalLogConfig.showTimestamp && (_jsx("span", { className: "log-timestamp", children: formatTimestamp(entry.timestamp) })), finalLogConfig.showLevel && (_jsx("span", { className: "log-level", style: { color: levelColor, borderColor: levelColor }, children: entry.level.toUpperCase() })), finalLogConfig.showSource && entry.source && (_jsxs("span", { className: "log-source", children: ["[", entry.source, "]"] })), _jsx("span", { className: "log-message", children: entry.message })] }), isExpanded && entry.details && (_jsx("div", { className: "log-details", children: _jsx("pre", { children: JSON.stringify(entry.details, null, 2) }) }))] }));
    });
    // Filter toolbar
    const FilterToolbar = React.memo(() => (_jsxs("div", { className: "log-filters", children: [_jsxs("div", { className: "filter-group", children: [_jsx("label", { children: "Levels:" }), availableFilters.levels.map(level => (_jsxs("label", { className: "filter-checkbox", children: [_jsx("input", { type: "checkbox", checked: filters.levels.has(level), onChange: (e) => handleLevelFilter(level, e.target.checked) }), _jsx("span", { style: { color: finalLogConfig.levelColors?.[level] }, children: level })] }, level)))] }), _jsxs("div", { className: "filter-group", children: [_jsx("label", { children: "Sources:" }), availableFilters.sources.map(source => (_jsxs("label", { className: "filter-checkbox", children: [_jsx("input", { type: "checkbox", checked: filters.sources.has(source), onChange: (e) => handleSourceFilter(source, e.target.checked) }), source] }, source)))] }), _jsx("div", { className: "filter-group", children: _jsx("input", { type: "text", placeholder: "Search keywords...", className: "keyword-filter", onChange: (e) => handleKeywordFilter(e.target.value) }) })] })));
    return (_jsx(WidgetContainer, { id: id, title: title || 'Streaming Logs', toolbar: _jsxs("div", { className: "log-toolbar", children: [_jsxs("span", { className: "log-count", children: [logEntries.length, " entries"] }), _jsx("button", { className: `auto-scroll-btn ${autoScroll ? 'active' : ''}`, onClick: () => setAutoScroll(!autoScroll), children: "Auto-scroll" }), _jsx("button", { className: "clear-btn", onClick: () => {
                        // Clear would need to be implemented in the stream manager
                        if (onEvent) {
                            onEvent({
                                type: 'custom',
                                source: { id },
                                data: { action: 'clear' },
                                timestamp: Date.now(),
                                propagate: true
                            });
                        }
                    }, children: "Clear" }), metrics && (_jsxs("span", { className: "performance-info", children: [metrics.fps?.toFixed(1), " fps"] }))] }), collapsible: true, ...props, children: _jsxs("div", { ref: containerRef, className: "streaming-log-container", children: [_jsx(FilterToolbar, {}), _jsx("div", { className: "log-content", style: { height: containerSize.height - 80 }, children: finalLogConfig.performance?.virtualization && logEntries.length > 100 ? (_jsx(List, { ref: listRef, height: containerSize.height - 80, itemCount: logEntries.length, itemSize: 60, width: "100%", overscanCount: 10, children: LogEntryComponent })) : (_jsx("div", { className: "log-entries", children: logEntries.map((_, index) => (_jsx(LogEntryComponent, { index: index, style: { height: 60 } }, index))) })) })] }) }));
};
export default StreamingLogWidget;
