import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { WidgetContainer } from './WidgetContainer';
import { useWidgetStream } from '../hooks/useWidgetStream';
export function TableWidget({ id, title, streamId }) {
    const data = useWidgetStream(streamId);
    const columns = React.useMemo(() => {
        if (data.length === 0)
            return [];
        return Object.keys(data[0]?.value || {});
    }, [data]);
    return (_jsx(WidgetContainer, { id: id, title: title || 'Table', children: _jsx("div", { style: { maxHeight: '300px', overflow: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((column) => (_jsx("th", { style: {
                                    border: '1px solid #ddd',
                                    padding: '8px',
                                    backgroundColor: '#f5f5f5',
                                }, children: column }, column))) }) }), _jsx("tbody", { children: data.slice(-50).map((item, index) => (_jsx("tr", { children: columns.map((column) => (_jsx("td", { style: {
                                    border: '1px solid #ddd',
                                    padding: '8px',
                                }, children: String(item.value[column] ?? '') }, column))) }, `${item.timestamp}-${index}`))) })] }) }) }));
}
