import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { debounce } from 'lodash';
import { WidgetContainer } from './WidgetContainer';
import { useWidgetStream } from '../../hooks/useWidgetStream';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
export const VirtualizedTableWidget = ({ id, title, streamId, config = {}, tableConfig, realTimeUpdate = true, maxRows = 10000, onEvent, ...props }) => {
    const containerRef = useRef(null);
    const listRef = useRef(null);
    const { startMonitoring, stopMonitoring, metrics } = usePerformanceMonitor(id);
    // State management
    const [sortConfig, setSortConfig] = useState(null);
    const [filterConfig, setFilterConfig] = useState({});
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [containerSize, setContainerSize] = useState({ width: 800, height: 400 });
    // Stream data
    const streamData = useWidgetStream(streamId, {
        throttle: realTimeUpdate ? 50 : 500,
        maxBuffer: maxRows,
    });
    // Table configuration with defaults
    const finalTableConfig = useMemo(() => {
        const defaultConfig = {
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
        if (!streamData || streamData.length === 0)
            return [];
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
                if (aVal === bVal)
                    return 0;
                const comparison = aVal < bVal ? -1 : 1;
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }
        // Limit rows for performance
        if (rows.length > finalTableConfig.maxRows) {
            rows = rows.slice(-finalTableConfig.maxRows);
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
        if (tableData.length === 0)
            return [];
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
    const handleSort = useCallback((columnKey) => {
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
                type: 'change',
                source: { id },
                data: { action: 'sort', column: columnKey },
                timestamp: Date.now(),
                propagate: false
            });
        }
    }, [onEvent, id]);
    const handleFilter = useCallback(debounce((columnKey, value, operator = 'contains') => {
        setFilterConfig(prev => {
            if (!value) {
                const { [columnKey]: removed, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [columnKey]: { value, operator: operator }
            };
        });
        if (onEvent) {
            onEvent({
                type: 'change',
                source: { id },
                data: { action: 'filter', column: columnKey, value },
                timestamp: Date.now(),
                propagate: false
            });
        }
    }, 300), [onEvent, id]);
    const handleRowSelect = useCallback((rowIndex, isSelected) => {
        if (!finalTableConfig.selectable)
            return;
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (isSelected) {
                if (!finalTableConfig.multiSelect) {
                    newSet.clear();
                }
                newSet.add(rowIndex);
            }
            else {
                newSet.delete(rowIndex);
            }
            return newSet;
        });
        if (onEvent) {
            onEvent({
                type: 'select',
                source: { id },
                data: { rowIndex, isSelected, selectedCount: selectedRows.size },
                timestamp: Date.now(),
                propagate: true
            });
        }
    }, [finalTableConfig.selectable, finalTableConfig.multiSelect, onEvent, id, selectedRows.size]);
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
    // Header component
    const TableHeader = React.memo(() => (_jsx("div", { className: "table-header", style: { height: finalTableConfig.headerHeight }, children: _jsxs("div", { className: "table-row header-row", children: [finalTableConfig.selectable && (_jsx("div", { className: "table-cell header-cell", style: { width: 50 }, children: _jsx("input", { type: "checkbox", checked: selectedRows.size === tableData.length && tableData.length > 0, onChange: (e) => {
                            if (e.target.checked) {
                                setSelectedRows(new Set(tableData.map((_, index) => index)));
                            }
                            else {
                                setSelectedRows(new Set());
                            }
                        } }) })), columns.map((column, index) => (_jsxs("div", { className: `table-cell header-cell ${column.sortable ? 'sortable' : ''}`, style: { width: columnWidths[index] }, onClick: () => column.sortable && handleSort(column.key), children: [_jsxs("div", { className: "header-content", children: [_jsx("span", { className: "header-title", children: column.title }), column.sortable && sortConfig?.key === column.key && (_jsx("span", { className: "sort-indicator", children: sortConfig.direction === 'asc' ? '↑' : '↓' }))] }), column.filterable && (_jsx("input", { type: "text", placeholder: "Filter...", className: "filter-input", onClick: (e) => e.stopPropagation(), onChange: (e) => handleFilter(column.key, e.target.value) }))] }, column.key)))] }) })));
    // Row component for virtualization
    const TableRow = React.memo(({ index, style }) => {
        const row = tableData[index];
        const isSelected = selectedRows.has(index);
        return (_jsxs("div", { style: style, className: `table-row ${isSelected ? 'selected' : ''}`, children: [finalTableConfig.selectable && (_jsx("div", { className: "table-cell", style: { width: 50 }, children: _jsx("input", { type: "checkbox", checked: isSelected, onChange: (e) => handleRowSelect(index, e.target.checked) }) })), columns.map((column, colIndex) => {
                    const value = row[column.key];
                    const displayValue = column.formatter ? column.formatter(value) : String(value || '');
                    return (_jsx("div", { className: "table-cell", style: { width: columnWidths[colIndex] }, title: displayValue, children: column.render ? column.render(value, row, index) : displayValue }, column.key));
                })] }));
    });
    const shouldUseVirtualization = tableData.length > (finalTableConfig.virtualScrolling?.threshold || 100);
    return (_jsx(WidgetContainer, { id: id, title: title || 'Virtualized Table', toolbar: _jsxs("div", { className: "table-toolbar", children: [_jsxs("span", { className: "row-count", children: [tableData.length, " rows"] }), selectedRows.size > 0 && (_jsxs("span", { className: "selected-count", children: [selectedRows.size, " selected"] })), metrics && (_jsxs("span", { className: "performance-info", children: [metrics.fps?.toFixed(1), " fps"] }))] }), ...props, children: _jsxs("div", { ref: containerRef, className: "virtualized-table-container", children: [_jsx(TableHeader, {}), _jsx("div", { className: "table-body", style: { height: containerSize.height - (finalTableConfig.headerHeight || 50) }, children: shouldUseVirtualization ? (_jsx(List, { ref: listRef, height: containerSize.height - (finalTableConfig.headerHeight || 50), itemCount: tableData.length, itemSize: finalTableConfig.rowHeight || 40, width: "100%", children: TableRow })) : (_jsx("div", { className: "table-rows", children: tableData.map((_, index) => (_jsx(TableRow, { index: index, style: { height: finalTableConfig.rowHeight || 40 } }, index))) })) })] }) }));
};
export default VirtualizedTableWidget;
