import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { addEdge as addReactFlowEdge } from '@xyflow/react';
const initialState = {
    // Node library state
    definitions: [],
    categories: [],
    searchTerm: '',
    selectedCategory: null,
    // Canvas state
    nodes: [],
    edges: [],
    selectedNodes: [],
    selectedEdges: [],
    draggedNodeType: null,
    nextNodeId: 1,
};
export const useFlowStore = create()(devtools((set, get) => ({
    ...initialState,
    // Node library actions
    setSearchTerm: (term) => set({ searchTerm: term }),
    setSelectedCategory: (category) => set({ selectedCategory: category }),
    registerNodeDefinition: (definition) => set((state) => {
        const existing = state.definitions.find((d) => d.type === definition.type);
        if (existing)
            return state;
        const newCategories = state.categories.includes(definition.category)
            ? state.categories
            : [...state.categories, definition.category];
        return {
            definitions: [...state.definitions, definition],
            categories: newCategories
        };
    }),
    // Canvas actions
    addNode: (definition, position) => set((state) => {
        const id = `node-${state.nextNodeId}`;
        const newNode = {
            id,
            type: definition.type,
            position,
            data: {
                label: definition.label,
                definition,
                config: definition.config || {},
                inputs: definition.inputs,
                outputs: definition.outputs,
            },
        };
        return {
            nodes: [...state.nodes, newNode],
            nextNodeId: state.nextNodeId + 1,
        };
    }),
    removeNode: (id) => set((state) => ({
        nodes: state.nodes.filter((node) => node.id !== id),
        edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
        selectedNodes: state.selectedNodes.filter((nodeId) => nodeId !== id),
    })),
    updateNodeData: (id, data) => set((state) => ({
        nodes: state.nodes.map((node) => node.id === id
            ? { ...node, data: { ...node.data, ...data } }
            : node),
    })),
    // Connection actions
    addEdge: (connection) => set((state) => {
        const validation = get().validateConnection(connection);
        if (!validation.valid) {
            console.warn('Invalid connection:', validation.reason);
            return state;
        }
        return {
            edges: addReactFlowEdge(connection, state.edges),
        };
    }),
    removeEdge: (id) => set((state) => ({
        edges: state.edges.filter((edge) => edge.id !== id),
        selectedEdges: state.selectedEdges.filter((edgeId) => edgeId !== id),
    })),
    validateConnection: (connection) => {
        const { nodes } = get();
        const sourceNode = nodes.find((n) => n.id === connection.source);
        const targetNode = nodes.find((n) => n.id === connection.target);
        if (!sourceNode || !targetNode) {
            return {
                sourceNodeId: connection.source,
                sourcePortId: connection.sourceHandle,
                targetNodeId: connection.target,
                targetPortId: connection.targetHandle,
                valid: false,
                reason: 'Source or target node not found'
            };
        }
        const sourcePort = sourceNode.data.outputs.find((p) => p.id === connection.sourceHandle);
        const targetPort = targetNode.data.inputs.find((p) => p.id === connection.targetHandle);
        if (!sourcePort || !targetPort) {
            return {
                sourceNodeId: connection.source,
                sourcePortId: connection.sourceHandle,
                targetNodeId: connection.target,
                targetPortId: connection.targetHandle,
                valid: false,
                reason: 'Source or target port not found'
            };
        }
        // Type compatibility check
        const typesCompatible = sourcePort.type === 'any' ||
            targetPort.type === 'any' ||
            sourcePort.type === targetPort.type;
        if (!typesCompatible) {
            return {
                sourceNodeId: connection.source,
                sourcePortId: connection.sourceHandle,
                targetNodeId: connection.target,
                targetPortId: connection.targetHandle,
                valid: false,
                reason: `Type mismatch: ${sourcePort.type} -> ${targetPort.type}`
            };
        }
        return {
            sourceNodeId: connection.source,
            sourcePortId: connection.sourceHandle,
            targetNodeId: connection.target,
            targetPortId: connection.targetHandle,
            valid: true
        };
    },
    // Selection actions
    setSelectedNodes: (ids) => set({ selectedNodes: ids }),
    setSelectedEdges: (ids) => set({ selectedEdges: ids }),
    clearSelection: () => set({ selectedNodes: [], selectedEdges: [] }),
    // Drag and drop
    setDraggedNodeType: (type) => set({ draggedNodeType: type }),
}), { name: 'flow-store' }));
