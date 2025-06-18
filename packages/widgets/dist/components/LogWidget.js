import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { WidgetContainer } from './WidgetContainer';
import { useWidgetStream } from '../hooks/useWidgetStream';
export function LogWidget({ id, title, streamId }) {
    const data = useWidgetStream(streamId);
    const containerRef = React.useRef(null);
    React.useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [data]);
    const getLevelColor = (level) => {
        switch (level) {
            case 'error':
                return '#ff4444';
            case 'warn':
                return '#ffaa00';
            case 'info':
                return '#00aaff';
            case 'debug':
                return '#888888';
            default:
                return '#000000';
        }
    };
    return (_jsx(WidgetContainer, { id: id, title: title || 'Log', children: _jsx("div", { ref: containerRef, style: {
                height: '300px',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '12px',
                backgroundColor: '#1e1e1e',
                color: '#ffffff',
                padding: '8px',
            }, children: data.slice(-100).map((item, index) => (_jsxs("div", { style: { marginBottom: '2px' }, children: [_jsx("span", { style: { color: '#888' }, children: new Date(item.timestamp).toLocaleTimeString() }), _jsxs("span", { style: {
                            color: getLevelColor(item.value.level),
                            marginLeft: '8px',
                            marginRight: '8px',
                        }, children: ["[", item.value.level.toUpperCase(), "]"] }), _jsx("span", { children: item.value.message })] }, `${item.timestamp}-${index}`))) }) }));
}
