import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useTableStream } from '../hooks/useStreamData';
export function StreamingTable({ id, title = 'Streaming Table', streamId, pageSize = 50, updateInterval = 100, // Slower updates for tables
showMetrics = false, columns, config }) {
    const { tableData, isConnected, error, metrics, currentPage, totalPages, setPage } = useTableStream(streamId || id, {
        pageSize,
        updateInterval,
        enableBackpressure: true
    });
    const autoColumns = useMemo(() => {
        if (columns)
            return columns;
        if (tableData.length === 0)
            return [];
        const firstRow = tableData[0].value;
        return Object.keys(firstRow).map(key => ({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            formatter: (value) => String(value)
        }));
    }, [columns, tableData]);
    const connectionStatus = useMemo(() => {
        if (error)
            return 'error';
        if (!isConnected)
            return 'disconnected';
        return 'connected';
    }, [isConnected, error]);
    const statusColor = {
        connected: '#4CAF50',
        disconnected: '#FF9800',
        error: '#F44336'
    }[connectionStatus];
    return (_jsxs("div", { className: "streaming-table", style: {
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fff'
        }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    borderBottom: '1px solid #eee'
                }, children: [_jsx("h3", { style: { margin: 0, fontSize: '16px', fontWeight: 'bold' }, children: title }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("div", { style: {
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: statusColor
                                } }), _jsx("span", { style: { fontSize: '12px', color: '#666' }, children: connectionStatus })] })] }), error ? (_jsxs("div", { style: {
                    color: '#F44336',
                    padding: '16px',
                    backgroundColor: '#FFEBEE',
                    margin: '16px',
                    borderRadius: '4px',
                    fontSize: '14px'
                }, children: ["Error: ", error.message] })) : (_jsxs(_Fragment, { children: [_jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: {
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '14px'
                            }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: '#F5F5F5' }, children: [_jsx("th", { style: {
                                                    padding: '12px 16px',
                                                    textAlign: 'left',
                                                    borderBottom: '1px solid #ddd',
                                                    fontWeight: 'bold',
                                                    width: '80px'
                                                }, children: "Time" }), autoColumns.map(column => (_jsx("th", { style: {
                                                    padding: '12px 16px',
                                                    textAlign: 'left',
                                                    borderBottom: '1px solid #ddd',
                                                    fontWeight: 'bold',
                                                    width: column.width
                                                }, children: column.label }, column.key)))] }) }), _jsx("tbody", { children: tableData.map((item, index) => (_jsxs("tr", { style: {
                                            backgroundColor: index % 2 === 0 ? '#fff' : '#F9F9F9'
                                        }, children: [_jsx("td", { style: {
                                                    padding: '12px 16px',
                                                    borderBottom: '1px solid #eee',
                                                    fontSize: '12px',
                                                    color: '#666'
                                                }, children: new Date(item.timestamp).toLocaleTimeString() }), autoColumns.map(column => {
                                                const value = item.value[column.key];
                                                const formatted = column.formatter ? column.formatter(value) : String(value);
                                                return (_jsx("td", { style: {
                                                        padding: '12px 16px',
                                                        borderBottom: '1px solid #eee'
                                                    }, children: formatted }, column.key));
                                            })] }, `${item.timestamp}-${index}`))) })] }) }), totalPages > 1 && (_jsxs("div", { style: {
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '16px',
                            borderTop: '1px solid #eee'
                        }, children: [_jsx("button", { onClick: () => setPage(currentPage - 1), disabled: currentPage === 0, style: {
                                    padding: '4px 8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: currentPage === 0 ? '#f5f5f5' : '#fff',
                                    cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
                                }, children: "Previous" }), _jsxs("span", { style: { fontSize: '14px', color: '#666' }, children: ["Page ", currentPage + 1, " of ", totalPages] }), _jsx("button", { onClick: () => setPage(currentPage + 1), disabled: currentPage >= totalPages - 1, style: {
                                    padding: '4px 8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: currentPage >= totalPages - 1 ? '#f5f5f5' : '#fff',
                                    cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer'
                                }, children: "Next" })] }))] })), showMetrics && (_jsxs("div", { style: {
                    padding: '12px 16px',
                    backgroundColor: '#F5F5F5',
                    borderTop: '1px solid #eee',
                    fontSize: '12px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    gap: '8px'
                }, children: [_jsxs("div", { children: [_jsx("strong", { children: "Total Messages:" }), " ", metrics.messageCount] }), _jsxs("div", { children: [_jsx("strong", { children: "Latency:" }), " ", metrics.averageLatency.toFixed(1), "ms"] }), _jsxs("div", { children: [_jsx("strong", { children: "Visible Rows:" }), " ", tableData.length] }), _jsxs("div", { children: [_jsx("strong", { children: "Page:" }), " ", currentPage + 1, "/", totalPages] })] }))] }));
}
