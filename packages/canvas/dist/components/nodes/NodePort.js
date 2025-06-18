import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './NodePort.css';
const typeColors = {
    string: '#10b981',
    number: '#3b82f6',
    boolean: '#f59e0b',
    object: '#8b5cf6',
    array: '#06b6d4',
    any: '#64748b',
};
const typeIcons = {
    string: 'T',
    number: '#',
    boolean: '✓',
    object: '{}',
    array: '[]',
    any: '*',
};
export const NodePort = ({ port, type }) => {
    const typeColor = typeColors[port.type] || '#64748b';
    const typeIcon = typeIcons[port.type] || '?';
    return (_jsx("div", { className: `node-port node-port-${type}`, children: _jsxs("div", { className: "node-port-info", children: [_jsxs("div", { className: "node-port-label", children: [port.label, port.required && _jsx("span", { className: "node-port-required", children: "*" })] }), _jsxs("div", { className: "node-port-type", style: { color: typeColor }, children: [_jsx("span", { className: "node-port-type-icon", children: typeIcon }), _jsx("span", { className: "node-port-type-label", children: port.type })] })] }) }));
};
