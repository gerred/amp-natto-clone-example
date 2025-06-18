import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useMemo, useRef } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, SelectionMode, ConnectionLineType, MarkerType, } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore } from '../store/flow-store';
import { CustomNode } from './nodes/CustomNode';
import { NodeLibrary } from './NodeLibrary';
import './Canvas.css';
const nodeTypes = {
    custom: CustomNode,
};
export const Canvas = ({ className = '', showLibrary = true, onNodeClick, onEdgeClick, }) => {
    const reactFlowWrapper = useRef(null);
    const { nodes, edges, selectedNodes, selectedEdges, addNode, removeNode, addEdge: addStoreEdge, removeEdge, setSelectedNodes, setSelectedEdges, clearSelection, validateConnection, setDraggedNodeType, definitions, } = useFlowStore();
    const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(nodes);
    const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(edges);
    const [reactFlowInstance, setReactFlowInstance] = React.useState(null);
    // Sync store with React Flow state
    React.useEffect(() => {
        setNodes(nodes);
    }, [nodes, setNodes]);
    React.useEffect(() => {
        setEdges(edges);
    }, [edges, setEdges]);
    const onConnect = useCallback((connection) => {
        const validation = validateConnection(connection);
        if (validation.valid) {
            const newEdge = {
                ...connection,
                id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
                type: 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed },
                animated: false,
            };
            setEdges((eds) => addEdge(newEdge, eds));
            addStoreEdge(connection);
        }
    }, [validateConnection, addStoreEdge, setEdges]);
    const onNodeDragStop = useCallback((_event, _node, _nodes) => {
        // Handle node position updates if needed
    }, []);
    const onSelectionChange = useCallback(({ nodes, edges }) => {
        setSelectedNodes(nodes.map((n) => n.id));
        setSelectedEdges(edges.map((e) => e.id));
    }, [setSelectedNodes, setSelectedEdges]);
    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);
    const onDrop = useCallback((event) => {
        event.preventDefault();
        const nodeType = event.dataTransfer.getData('application/reactflow');
        const definition = definitions.find((d) => d.type === nodeType);
        if (!definition || !reactFlowInstance)
            return;
        const bounds = reactFlowWrapper.current?.getBoundingClientRect();
        if (!bounds)
            return;
        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
        });
        addNode(definition, position);
        setDraggedNodeType(null);
    }, [reactFlowInstance, definitions, addNode, setDraggedNodeType]);
    const onKeyDown = useCallback((event) => {
        if (event.key === 'Delete' || event.key === 'Backspace') {
            // Delete selected nodes and edges
            selectedNodes.forEach((nodeId) => removeNode(nodeId));
            selectedEdges.forEach((edgeId) => removeEdge(edgeId));
            clearSelection();
        }
    }, [selectedNodes, selectedEdges, removeNode, removeEdge, clearSelection]);
    const connectionLineStyle = useMemo(() => ({
        strokeWidth: 2,
        stroke: '#3b82f6',
    }), []);
    const defaultEdgeOptions = useMemo(() => ({
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2, stroke: '#64748b' },
    }), []);
    return (_jsxs("div", { className: `canvas-container ${className}`, children: [showLibrary && _jsx(NodeLibrary, {}), _jsx("div", { className: "canvas-main", ref: reactFlowWrapper, tabIndex: 0, onKeyDown: onKeyDown, children: _jsx(ReactFlowProvider, { children: _jsxs(ReactFlow, { nodes: reactFlowNodes, edges: reactFlowEdges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, onInit: setReactFlowInstance, onDrop: onDrop, onDragOver: onDragOver, onNodeDragStop: onNodeDragStop, onSelectionChange: onSelectionChange, onNodeClick: onNodeClick, onEdgeClick: onEdgeClick, nodeTypes: nodeTypes, connectionLineType: ConnectionLineType.SmoothStep, connectionLineStyle: connectionLineStyle, defaultEdgeOptions: defaultEdgeOptions, fitView: true, fitViewOptions: { padding: 0.2 }, selectNodesOnDrag: false, selectionMode: SelectionMode.Partial, multiSelectionKeyCode: "Shift", deleteKeyCode: ['Delete', 'Backspace'], snapToGrid: true, snapGrid: [16, 16], proOptions: { hideAttribution: true }, children: [_jsx(Background, { color: "#64748b", gap: 16 }), _jsx(Controls, {}), _jsx(MiniMap, { nodeColor: "#e2e8f0", maskColor: "rgba(0, 0, 0, 0.2)", style: {
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                } })] }) }) })] }));
};
