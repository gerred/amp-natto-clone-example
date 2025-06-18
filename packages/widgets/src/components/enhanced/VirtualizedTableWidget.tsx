import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { FixedSizeList as List, FixedSizeGrid as Grid } from 'react-window';
import { debounce } from 'lodash';
import { WidgetContainer } from './WidgetContainer';
import { useWidgetStream } from '../../hooks/useWidgetStream';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { WidgetProps, StreamData } from '../../core/types';

interface Column {
  key: string;
  title: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  formatter?: (value: any) => string;
}

interface TableConfig {
  columns: Column[];
  rowHeight?: number;
  headerHeight?: number;
  maxRows?: number;
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  multiSelect?: boolean;
  pagination?: {
    enabled: boolean;
    pageSize: number;
  };
  virtualScrolling?: {
    enabled: boolean;
    threshold: number;
  };
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  [key: string]: {
    value: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt';
  };
}

interface VirtualizedTableWidgetProps extends WidgetProps {
  tableConfig?: TableConfig;
  realTimeUpdate?: boolean;
  maxRows?: number;
}

export const VirtualizedTableWidget: React.FC<VirtualizedTableWidgetProps> = ({
  id,
  title,
  streamId,
  config = {},
  tableConfig,
  realTimeUpdate = true,
  maxRows = 10000,
  onEvent,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const { startMonitoring, stopMonitoring, metrics } = usePerformanceMonitor(id);

  // State management
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [containerSize, setContainerSize] = useState({ width: 800, height: 400 });

  // Stream data
  const streamData = useWidgetStream<StreamData>(streamId, {
    throttle: realTimeUpdate ? 50 : 500,
    maxBuffer: maxRows,
  });

  // Table configuration with defaults
  const finalTableConfig = useMemo((): TableConfig => {
    const defaultConfig: TableConfig = {
      columns: [],
      rowHeight: 40,
      headerHeight: 50,
      maxRows: 10000,
      sortable: true,
      filterable: true,
      selectable: false,
      multiSelect: false,
      virtualScrolling: {
        enabled: true,
        threshold: 100
      }
    };

    return { ...defaultConfig, ...tableConfig, ...config };
  }, [tableConfig, config]);

  // Transform stream data to table rows
  const tableData = useMemo(() => {
    if (!streamData || streamData.length === 0) return [];

    const startTime = performance.now();

    let rows = streamData.map((item, index) => {
      const value = item.value;
      
      if (typeof value === 'object' && value !== null) {
        return {
          _id: index,
          _timestamp: item.timestamp,
          _sequenceId: item.sequenceId,
          ...value
        };
      }
      
      return {
        _id: index,
        _timestamp: item.timestamp,
        _sequenceId: item.sequenceId,
        value: value
      };
    });

    // Apply filtering
    if (Object.keys(filterConfig).length > 0) {
      rows = rows.filter(row => {
        return Object.entries(filterConfig).every(([key, filter]) => {
          const value = String(row[key] || '').toLowerCase();
          const filterValue = filter.value.toLowerCase();
          
          switch (filter.operator) {
            case 'equals':
              return value === filterValue;
            case 'contains':
              return value.includes(filterValue);
            case 'startsWith':
              return value.startsWith(filterValue);
            case 'endsWith':
              return value.endsWith(filterValue);
            case 'gt':
              return Number(value) > Number(filterValue);
            case 'lt':
              return Number(value) < Number(filterValue);
            default:
              return true;
          }
        });
      });
    }

    // Apply sorting
    if (sortConfig) {
      rows.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    // Limit rows for performance
    if (rows.length > finalTableConfig.maxRows!) {
      rows = rows.slice(-finalTableConfig.maxRows!);
    }

    // Record performance metrics
    const endTime = performance.now();
    // Note: Performance metrics are handled by the hook

    return rows;
  }, [streamData, sortConfig, filterConfig, finalTableConfig.maxRows, metrics]);

  // Auto-generate columns if not provided
  const columns = useMemo(() => {
    if (finalTableConfig.columns.length > 0) {
      return finalTableConfig.columns;
    }

    // Auto-generate from data
    if (tableData.length === 0) return [];

    const firstRow = tableData[0];
    return Object.keys(firstRow)
      .filter(key => !key.startsWith('_'))
      .map(key => ({
        key,
        title: key.charAt(0).toUpperCase() + key.slice(1),
        width: 150,
        sortable: true,
        filterable: true,
        resizable: true
      }));
  }, [finalTableConfig.columns, tableData]);

  // Calculate column widths
  const columnWidths = useMemo(() => {
    const totalWidth = containerSize.width;
    const fixedWidths = columns.filter(col => col.width).reduce((sum, col) => sum + (col.width || 0), 0);
    const flexColumns = columns.filter(col => !col.width);
    const remainingWidth = totalWidth - fixedWidths;
    const flexWidth = flexColumns.length > 0 ? remainingWidth / flexColumns.length : 0;

    return columns.map(col => col.width || Math.max(100, flexWidth));
  }, [columns, containerSize.width]);

  // Event handlers
  const handleSort = useCallback((columnKey: string) => {
    setSortConfig(prev => {
      if (prev?.key === columnKey) {
        return prev.direction === 'asc' 
          ? { key: columnKey, direction: 'desc' }
          : null;
      }
      return { key: columnKey, direction: 'asc' };
    });

    if (onEvent) {
      onEvent({
        type: 'change' as any,
        source: { id } as any,
        data: { action: 'sort', column: columnKey },
        timestamp: Date.now(),
        propagate: false
      });
    }
  }, [onEvent, id]);

  const handleFilter = useCallback(
    debounce((columnKey: string, value: string, operator: string = 'contains') => {
      setFilterConfig(prev => {
        if (!value) {
          const { [columnKey]: removed, ...rest } = prev;
          return rest;
        }
        return {
          ...prev,
          [columnKey]: { value, operator: operator as any }
        };
      });

      if (onEvent) {
        onEvent({
          type: 'change' as any,
          source: { id } as any,
          data: { action: 'filter', column: columnKey, value },
          timestamp: Date.now(),
          propagate: false
        });
      }
    }, 300),
    [onEvent, id]
  );

  const handleRowSelect = useCallback((rowIndex: number, isSelected: boolean) => {
    if (!finalTableConfig.selectable) return;

    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        if (!finalTableConfig.multiSelect) {
          newSet.clear();
        }
        newSet.add(rowIndex);
      } else {
        newSet.delete(rowIndex);
      }
      return newSet;
    });

    if (onEvent) {
      onEvent({
        type: 'select' as any,
        source: { id } as any,
        data: { rowIndex, isSelected, selectedCount: selectedRows.size },
        timestamp: Date.now(),
        propagate: true
      });
    }
  }, [finalTableConfig.selectable, finalTableConfig.multiSelect, onEvent, id, selectedRows.size]);

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

  // Header component
  const TableHeader = React.memo(() => (
    <div className="table-header" style={{ height: finalTableConfig.headerHeight }}>
      <div className="table-row header-row">
        {finalTableConfig.selectable && (
          <div className="table-cell header-cell" style={{ width: 50 }}>
            <input
              type="checkbox"
              checked={selectedRows.size === tableData.length && tableData.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedRows(new Set(tableData.map((_, index) => index)));
                } else {
                  setSelectedRows(new Set());
                }
              }}
            />
          </div>
        )}
        {columns.map((column, index) => (
          <div
            key={column.key}
            className={`table-cell header-cell ${column.sortable ? 'sortable' : ''}`}
            style={{ width: columnWidths[index] }}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <div className="header-content">
              <span className="header-title">{column.title}</span>
              {column.sortable && sortConfig?.key === column.key && (
                <span className="sort-indicator">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
            {column.filterable && (
              <input
                type="text"
                placeholder="Filter..."
                className="filter-input"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleFilter(column.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  ));

  // Row component for virtualization
  const TableRow = React.memo<{ index: number; style: React.CSSProperties }>(({ index, style }) => {
    const row = tableData[index];
    const isSelected = selectedRows.has(index);

    return (
      <div style={style} className={`table-row ${isSelected ? 'selected' : ''}`}>
        {finalTableConfig.selectable && (
          <div className="table-cell" style={{ width: 50 }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleRowSelect(index, e.target.checked)}
            />
          </div>
        )}
        {columns.map((column, colIndex) => {
          const value = row[column.key];
          const displayValue = column.formatter ? column.formatter(value) : String(value || '');
          
          return (
            <div
              key={column.key}
              className="table-cell"
              style={{ width: columnWidths[colIndex] }}
              title={displayValue}
            >
              {column.render ? column.render(value, row, index) : displayValue}
            </div>
          );
        })}
      </div>
    );
  });

  const shouldUseVirtualization = tableData.length > (finalTableConfig.virtualScrolling?.threshold || 100);

  return (
    <WidgetContainer
      id={id}
      title={title || 'Virtualized Table'}
      toolbar={
        <div className="table-toolbar">
          <span className="row-count">{tableData.length} rows</span>
          {selectedRows.size > 0 && (
            <span className="selected-count">{selectedRows.size} selected</span>
          )}
          {metrics && (
            <span className="performance-info">
              {metrics.fps?.toFixed(1)} fps
            </span>
          )}
        </div>
      }
      {...props}
    >
      <div ref={containerRef} className="virtualized-table-container">
        <TableHeader />
        <div className="table-body" style={{ height: containerSize.height - (finalTableConfig.headerHeight || 50) }}>
          {shouldUseVirtualization ? (
            <List
              ref={listRef}
              height={containerSize.height - (finalTableConfig.headerHeight || 50)}
              itemCount={tableData.length}
              itemSize={finalTableConfig.rowHeight || 40}
              width="100%"
            >
              {TableRow}
            </List>
          ) : (
            <div className="table-rows">
              {tableData.map((_, index) => (
                <TableRow
                  key={index}
                  index={index}
                  style={{ height: finalTableConfig.rowHeight || 40 }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default VirtualizedTableWidget;
