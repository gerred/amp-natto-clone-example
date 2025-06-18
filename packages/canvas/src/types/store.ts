import type { Node, Edge, Connection } from '@xyflow/react'
import type { FlowNodeData, NodeDefinition, ConnectionValidation } from './node'

export interface NodeLibraryState {
  definitions: NodeDefinition[]
  categories: string[]
  searchTerm: string
  selectedCategory: string | null
}

export interface CanvasState {
  nodes: Node<FlowNodeData>[]
  edges: Edge[]
  selectedNodes: string[]
  selectedEdges: string[]
  draggedNodeType: string | null
  nextNodeId: number
}

export interface FlowStore extends NodeLibraryState, CanvasState {
  // Node library actions
  setSearchTerm: (term: string) => void
  setSelectedCategory: (category: string | null) => void
  registerNodeDefinition: (definition: NodeDefinition) => void
  
  // Canvas actions
  addNode: (definition: NodeDefinition, position: { x: number; y: number }) => void
  removeNode: (id: string) => void
  updateNodeData: (id: string, data: Partial<FlowNodeData>) => void
  
  // Connection actions
  addEdge: (connection: Connection) => void
  removeEdge: (id: string) => void
  validateConnection: (connection: Connection) => ConnectionValidation
  
  // Selection actions
  setSelectedNodes: (ids: string[]) => void
  setSelectedEdges: (ids: string[]) => void
  clearSelection: () => void
  
  // Drag and drop
  setDraggedNodeType: (type: string | null) => void
}
