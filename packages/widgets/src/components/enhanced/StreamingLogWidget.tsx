import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { debounce } from 'lodash';
import { WidgetContainer } from './WidgetContainer';
import { useWidgetStream } from '../../hooks/useWidgetStream';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { WidgetProps, StreamData } from '../../core/types';

interface LogEntry {
  timestamp: number;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  source?: string;
  details?: any;
  tags?: string[];
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

interface LogConfig {
  maxEntries?: number;
  autoScroll?: boolean;
  showTimestamp?: boolean;
  showLevel?: boolean;
  showSource?: boolean;
  dateFormat?: string;
  levelColors?: Record<string, string>;
  filters?: {
    levels?: string[];
    sources?: string[];
    keywords?: string[];
  };
  grouping?: {
    enabled: boolean;
    key: 'source' | 'level' | 'userId' | 'sessionId';
    maxGroups: number;
  };
  performance?: {
    virtualization: boolean;
    batchSize: number;
    updateInterval: number;
  };
}

interface StreamingLogWidgetProps extends WidgetProps {
  logConfig?: LogConfig;
  realTimeUpdate?: boolean;
  maxEntries?: number;
}

export const StreamingLogWidget: React.FC<StreamingLogWidgetProps> = ({
  id,
  title,
  streamId,
  config = {},
  logConfig,
  realTimeUpdate = true,
  maxEntries = 10000,
  onEvent,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const { startMonitoring, stopMonitoring, metrics } = usePerformanceMonitor(id);

  // State management
  const [filters, setFilters] = useState<{
    levels: Set<string>;
    sources: Set<string>;
    keywords: string;
  }>({
    levels: new Set(),
    sources: new Set(),
    keywords: ''
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 400 });
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());

  // Stream data
  const streamData = useWidgetStream<StreamData>(streamId, {
    throttle: realTimeUpdate ? 16 : 100, // 60fps for real-time
    maxBuffer: maxEntries,
  });

  // Log configuration with defaults
  const finalLogConfig = useMemo((): LogConfig => {
    const defaultConfig: LogConfig = {
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
    if (!streamData || streamData.length === 0) return [];



    let entries = streamData.map((item, index) => {
      const value = item.value;
      
      // Handle different log entry formats
      if (typeof value === 'object' && value !== null && 'level' in value && 'message' in value) {
        return {
          _id: index,
          _timestamp: item.timestamp,
          _sequenceId: item.sequenceId,
          ...value
        } as LogEntry & { _id: number; _timestamp: number; _sequenceId?: number };
      }
      
      // Convert simple values to log entries
      return {
        _id: index,
        _timestamp: item.timestamp,
        _sequenceId: item.sequenceId,
        timestamp: item.timestamp,
        level: 'info' as const,
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
        const searchText = `${entry.message} ${entry.source || ''} ${JSON.stringify((entry as any).details || '')}`.toLowerCase();
        return keywords.some(keyword => searchText.includes(keyword));
      });
    }

    // Limit entries for performance
    if (entries.length > finalLogConfig.maxEntries!) {
      entries = entries.slice(-finalLogConfig.maxEntries!);
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
  const formatTimestamp = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }, []);

  // Get unique values for filters
  const availableFilters = useMemo(() => {
    const levels = new Set<string>();
    const sources = new Set<string>();
    
    logEntries.forEach(entry => {
      levels.add(entry.level);
      if (entry.source) sources.add(entry.source);
    });

    return {
      levels: Array.from(levels),
      sources: Array.from(sources)
    };
  }, [logEntries]);

  // Event handlers
  const handleLevelFilter = useCallback((level: string, enabled: boolean) => {
    setFilters(prev => {
      const newLevels = new Set(prev.levels);
      if (enabled) {
        newLevels.add(level);
      } else {
        newLevels.delete(level);
      }
      return { ...prev, levels: newLevels };
    });
  }, []);

  const handleSourceFilter = useCallback((source: string, enabled: boolean) => {
    setFilters(prev => {
      const newSources = new Set(prev.sources);
      if (enabled) {
        newSources.add(source);
      } else {
        newSources.delete(source);
      }
      return { ...prev, sources: newSources };
    });
  }, []);

  const handleKeywordFilter = useCallback(
    debounce((keywords: string) => {
      setFilters(prev => ({ ...prev, keywords }));
    }, 300),
    []
  );

  const handleEntryClick = useCallback((entryId: number) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });

    if (onEvent) {
      onEvent({
        type: 'click' as any,
        source: { id } as any,
        data: { entryId, expanded: !expandedEntries.has(entryId) },
        timestamp: Date.now(),
        propagate: false
      });
    }
  }, [expandedEntries, onEvent, id]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;

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
  const LogEntryComponent = React.memo<{ index: number; style: React.CSSProperties }>(({ index, style }) => {
    const entry = logEntries[index];
    if (!entry) return null;
    
    const isExpanded = expandedEntries.has(entry._id);
    const levelColor = finalLogConfig.levelColors?.[entry.level] || '#6b7280';

    return (
      <div
        style={style}
        className={`log-entry level-${entry.level} ${isExpanded ? 'expanded' : ''}`}
        onClick={() => handleEntryClick(entry._id)}
      >
        <div className="log-entry-main">
          {finalLogConfig.showTimestamp && (
            <span className="log-timestamp">
              {formatTimestamp(entry.timestamp)}
            </span>
          )}
          {finalLogConfig.showLevel && (
            <span 
              className="log-level"
              style={{ color: levelColor, borderColor: levelColor }}
            >
              {entry.level.toUpperCase()}
            </span>
          )}
          {finalLogConfig.showSource && entry.source && (
            <span className="log-source">[{entry.source}]</span>
          )}
          <span className="log-message">{entry.message}</span>
        </div>
        {isExpanded && (entry as any).details && (
          <div className="log-details">
            <pre>{JSON.stringify((entry as any).details, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  });

  // Filter toolbar
  const FilterToolbar = React.memo(() => (
    <div className="log-filters">
      <div className="filter-group">
        <label>Levels:</label>
        {availableFilters.levels.map(level => (
          <label key={level} className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.levels.has(level)}
              onChange={(e) => handleLevelFilter(level, e.target.checked)}
            />
            <span style={{ color: finalLogConfig.levelColors?.[level] }}>
              {level}
            </span>
          </label>
        ))}
      </div>
      <div className="filter-group">
        <label>Sources:</label>
        {availableFilters.sources.map(source => (
          <label key={source} className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.sources.has(source)}
              onChange={(e) => handleSourceFilter(source, e.target.checked)}
            />
            {source}
          </label>
        ))}
      </div>
      <div className="filter-group">
        <input
          type="text"
          placeholder="Search keywords..."
          className="keyword-filter"
          onChange={(e) => handleKeywordFilter(e.target.value)}
        />
      </div>
    </div>
  ));

  return (
    <WidgetContainer
      id={id}
      title={title || 'Streaming Logs'}
      toolbar={
        <div className="log-toolbar">
          <span className="log-count">{logEntries.length} entries</span>
          <button
            className={`auto-scroll-btn ${autoScroll ? 'active' : ''}`}
            onClick={() => setAutoScroll(!autoScroll)}
          >
            Auto-scroll
          </button>
          <button
            className="clear-btn"
            onClick={() => {
              // Clear would need to be implemented in the stream manager
              if (onEvent) {
                onEvent({
                  type: 'custom' as any,
                  source: { id } as any,
                  data: { action: 'clear' },
                  timestamp: Date.now(),
                  propagate: true
                });
              }
            }}
          >
            Clear
          </button>
          {metrics && (
            <span className="performance-info">
              {metrics.fps?.toFixed(1)} fps
            </span>
          )}
        </div>
      }
      collapsible
      {...props}
    >
      <div ref={containerRef} className="streaming-log-container">
        <FilterToolbar />
        <div className="log-content" style={{ height: containerSize.height - 80 }}>
          {finalLogConfig.performance?.virtualization && logEntries.length > 100 ? (
            <List
              ref={listRef}
              height={containerSize.height - 80}
              itemCount={logEntries.length}
              itemSize={60}
              width="100%"
              overscanCount={10}
            >
              {LogEntryComponent}
            </List>
          ) : (
            <div className="log-entries">
              {logEntries.map((_, index) => (
                <LogEntryComponent
                  key={index}
                  index={index}
                  style={{ height: 60 }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default StreamingLogWidget;
