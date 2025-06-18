import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Canvas } from './Canvas';
import { useNodeDefinitions } from '../hooks/useNodeDefinitions';
import { useFlowStore } from '../store/flow-store';
import './CanvasDemo.css';
export const CanvasDemo = () => {
    // Initialize node definitions
    useNodeDefinitions();
    const { addNode, definitions } = useFlowStore();
    // Add some example nodes on mount
    useEffect(() => {
        if (definitions.length > 0) {
            // Add a text input node
            const textInputDef = definitions.find((d) => d.type === 'text-input');
            if (textInputDef) {
                addNode(textInputDef, { x: 100, y: 100 });
            }
            // Add a text transform node
            const textTransformDef = definitions.find((d) => d.type === 'text-transform');
            if (textTransformDef) {
                addNode(textTransformDef, { x: 400, y: 100 });
            }
            // Add a console output node
            const consoleOutputDef = definitions.find((d) => d.type === 'console-output');
            if (consoleOutputDef) {
                addNode(consoleOutputDef, { x: 700, y: 100 });
            }
            // Add an AI node
            const openaiChatDef = definitions.find((d) => d.type === 'openai-chat');
            if (openaiChatDef) {
                addNode(openaiChatDef, { x: 250, y: 300 });
            }
            // Add an HTTP request node
            const httpRequestDef = definitions.find((d) => d.type === 'http-request');
            if (httpRequestDef) {
                addNode(httpRequestDef, { x: 550, y: 300 });
            }
        }
    }, [definitions.length, addNode, definitions]);
    const handleNodeClick = (_event, node) => {
        console.log('Node clicked:', node);
    };
    const handleEdgeClick = (_event, edge) => {
        console.log('Edge clicked:', edge);
    };
    return (_jsxs("div", { className: "canvas-demo", children: [_jsxs("div", { className: "canvas-demo-header", children: [_jsx("h1", { children: "Node Flow Canvas Demo" }), _jsx("p", { children: "Drag nodes from the library to create your flow. Click and drag to connect compatible ports. Use keyboard shortcuts: Delete/Backspace to remove selected nodes and edges." }), _jsxs("div", { className: "canvas-demo-stats", children: [_jsxs("span", { children: ["Available Nodes: ", definitions.length] }), _jsxs("span", { children: ["Categories: ", new Set(definitions.map((d) => d.category)).size] })] })] }), _jsx("div", { className: "canvas-demo-container", children: _jsx(Canvas, { onNodeClick: handleNodeClick, onEdgeClick: handleEdgeClick, className: "demo-canvas" }) })] }));
};
