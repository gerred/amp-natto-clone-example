import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodePort } from './NodePort';
import './CustomNode.css';
const categoryColors = {
    input: '#10b981',
    transform: '#3b82f6',
    output: '#f59e0b',
    ai: '#8b5cf6',
    http: '#06b6d4',
    filter: '#ef4444',
    merge: '#84cc16',
};
const categoryIcons = {
    input: '📥',
    transform: '⚙️',
    output: '📤',
    ai: '🤖',
    http: '🌐',
    filter: '🔍',
    merge: '🔀',
};
export const CustomNode = memo(({ data, selected }) => {
    const { definition, inputs, outputs } = data;
    const categoryColor = categoryColors[definition.category] || '#64748b';
    const categoryIcon = definition.icon || categoryIcons[definition.category] || '📦';
    return (_jsxs("div", { className: `custom-node ${selected ? 'selected' : ''}`, children: [inputs.map((input, index) => (_jsx(Handle, { type: "target", position: Position.Left, id: input.id, style: {
                    top: `${20 + (index * 24)}px`,
                    background: '#64748b',
                }, className: "node-handle" }, `input-${input.id}`))), outputs.map((output, index) => (_jsx(Handle, { type: "source", position: Position.Right, id: output.id, style: {
                    top: `${20 + (index * 24)}px`,
                    background: categoryColor,
                }, className: "node-handle" }, `output-${output.id}`))), _jsxs("div", { className: "custom-node-header", style: { borderTopColor: categoryColor }, children: [_jsx("div", { className: "custom-node-icon", children: categoryIcon }), _jsx("div", { className: "custom-node-title", children: data.label }), _jsx("div", { className: "custom-node-category-badge", style: { backgroundColor: categoryColor }, children: definition.category })] }), _jsxs("div", { className: "custom-node-body", children: [inputs.length > 0 && (_jsx("div", { className: "custom-node-ports", children: _jsxs("div", { className: "custom-node-ports-section", children: [_jsx("div", { className: "custom-node-ports-title", children: "Inputs" }), inputs.map((input) => (_jsx(NodePort, { port: input, type: "input" }, input.id)))] }) })), outputs.length > 0 && (_jsx("div", { className: "custom-node-ports", children: _jsxs("div", { className: "custom-node-ports-section", children: [_jsx("div", { className: "custom-node-ports-title", children: "Outputs" }), outputs.map((output) => (_jsx(NodePort, { port: output, type: "output" }, output.id)))] }) })), Object.keys(data.config).length > 0 && (_jsxs("div", { className: "custom-node-config", children: [_jsx("div", { className: "custom-node-config-title", children: "Configuration" }), _jsxs("div", { className: "custom-node-config-items", children: [Object.entries(data.config).slice(0, 2).map(([key, value]) => (_jsxs("div", { className: "custom-node-config-item", children: [_jsxs("span", { className: "custom-node-config-key", children: [key, ":"] }), _jsx("span", { className: "custom-node-config-value", children: String(value).length > 20
                                                    ? `${String(value).substring(0, 20)}...`
                                                    : String(value) })] }, key))), Object.keys(data.config).length > 2 && (_jsxs("div", { className: "custom-node-config-more", children: ["+", Object.keys(data.config).length - 2, " more"] }))] })] }))] })] }));
});
CustomNode.displayName = 'CustomNode';
