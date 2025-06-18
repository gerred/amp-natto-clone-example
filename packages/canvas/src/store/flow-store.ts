import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Connection, Node, Edge } from '@xyflow/react'
import { addEdge as addReactFlowEdge } from '@xyflow/react'
import type { FlowStore, FlowNodeData, NodeDefinition, ConnectionValidation } from '../types'

const initialState = {
  // Node library state
  definitions: [] as NodeDefinition[],
  categories: [] as string[],
  searchTerm: '',
  selectedCategory: null as string | null,
  
  // Canvas state
  nodes: [] as Node<FlowNodeData>[],
  edges: [] as Edge[],
  selectedNodes: [] as string[],
  selectedEdges: [] as string[],
  draggedNodeType: null as string | null,
  nextNodeId: 1,
}

export const useFlowStore = create<FlowStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Node library actions
      setSearchTerm: (term: string) => set({ searchTerm: term }),
      
      setSelectedCategory: (category: string | null) => set({ selectedCategory: category }),
      
      registerNodeDefinition: (definition: NodeDefinition) => set((state) => {
        const existing = state.definitions.find((d: NodeDefinition) => d.type === definition.type)
        if (existing) return state
        
        const newCategories = state.categories.includes(definition.category) 
          ? state.categories 
          : [...state.categories, definition.category]
        
        return {
          definitions: [...state.definitions, definition],
          categories: newCategories
        }
      }),

      // Canvas actions
      addNode: (definition: NodeDefinition, position: { x: number; y: number }) => set((state) => {
        const id = `node-${state.nextNodeId}`
        const newNode: Node<FlowNodeData> = {
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
        }
        
        return {
          nodes: [...state.nodes, newNode],
          nextNodeId: state.nextNodeId + 1,
        }
      }),
      
      removeNode: (id: string) => set((state) => ({
        nodes: state.nodes.filter((node: Node<FlowNodeData>) => node.id !== id),
        edges: state.edges.filter((edge: Edge) => edge.source !== id && edge.target !== id),
        selectedNodes: state.selectedNodes.filter((nodeId: string) => nodeId !== id),
      })),
      
      updateNodeData: (id: string, data: Partial<FlowNodeData>) => set((state) => ({
        nodes: state.nodes.map((node: Node<FlowNodeData>) => 
          node.id === id 
            ? { ...node, data: { ...node.data, ...data } }
            : node
        ),
      })),

      // Connection actions
      addEdge: (connection: Connection) => set((state) => {
        const validation = get().validateConnection(connection)
        if (!validation.valid) {
          console.warn('Invalid connection:', validation.reason)
          return state
        }
        
        return {
          edges: addReactFlowEdge(connection, state.edges),
        }
      }),
      
      removeEdge: (id: string) => set((state) => ({
        edges: state.edges.filter((edge: Edge) => edge.id !== id),
        selectedEdges: state.selectedEdges.filter((edgeId: string) => edgeId !== id),
      })),
      
      validateConnection: (connection: Connection): ConnectionValidation => {
        const { nodes } = get()
        const sourceNode = nodes.find((n: Node<FlowNodeData>) => n.id === connection.source)
        const targetNode = nodes.find((n: Node<FlowNodeData>) => n.id === connection.target)
        
        if (!sourceNode || !targetNode) {
          return {
            sourceNodeId: connection.source!,
            sourcePortId: connection.sourceHandle!,
            targetNodeId: connection.target!,
            targetPortId: connection.targetHandle!,
            valid: false,
            reason: 'Source or target node not found'
          }
        }
        
        const sourcePort = sourceNode.data.outputs.find((p: any) => p.id === connection.sourceHandle)
        const targetPort = targetNode.data.inputs.find((p: any) => p.id === connection.targetHandle)
        
        if (!sourcePort || !targetPort) {
          return {
            sourceNodeId: connection.source!,
            sourcePortId: connection.sourceHandle!,
            targetNodeId: connection.target!,
            targetPortId: connection.targetHandle!,
            valid: false,
            reason: 'Source or target port not found'
          }
        }
        
        // Type compatibility check
        const typesCompatible = sourcePort.type === 'any' || 
                               targetPort.type === 'any' || 
                               sourcePort.type === targetPort.type
        
        if (!typesCompatible) {
          return {
            sourceNodeId: connection.source!,
            sourcePortId: connection.sourceHandle!,
            targetNodeId: connection.target!,
            targetPortId: connection.targetHandle!,
            valid: false,
            reason: `Type mismatch: ${sourcePort.type} -> ${targetPort.type}`
          }
        }
        
        return {
          sourceNodeId: connection.source!,
          sourcePortId: connection.sourceHandle!,
          targetNodeId: connection.target!,
          targetPortId: connection.targetHandle!,
          valid: true
        }
      },

      // Selection actions
      setSelectedNodes: (ids: string[]) => set({ selectedNodes: ids }),
      setSelectedEdges: (ids: string[]) => set({ selectedEdges: ids }),
      clearSelection: () => set({ selectedNodes: [], selectedEdges: [] }),
      
      // Drag and drop
      setDraggedNodeType: (type: string | null) => set({ draggedNodeType: type }),
    }),
    { name: 'flow-store' }
  )
)
