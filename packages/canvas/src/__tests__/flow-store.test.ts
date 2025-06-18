import { renderHook, act } from '@testing-library/react'
import { useFlowStore } from '../store/flow-store'
import type { NodeDefinition } from '../types'

const mockDefinition: NodeDefinition = {
  type: 'test-node',
  label: 'Test Node',
  category: 'transform',
  description: 'A test node',
  inputs: [{ id: 'input1', label: 'Input 1', type: 'string', required: true }],
  outputs: [{ id: 'output1', label: 'Output 1', type: 'string' }],
  config: { testConfig: 'value' },
}

describe('useFlowStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFlowStore.setState({
      definitions: [],
      categories: [],
      searchTerm: '',
      selectedCategory: null,
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      draggedNodeType: null,
      nextNodeId: 1,
    })
  })

  describe('Node library actions', () => {
    it('should register a new node definition', () => {
      const { result } = renderHook(() => useFlowStore())

      act(() => {
        result.current.registerNodeDefinition(mockDefinition)
      })

      expect(result.current.definitions).toContain(mockDefinition)
      expect(result.current.categories).toContain('transform')
    })

    it('should not register duplicate node definitions', () => {
      const { result } = renderHook(() => useFlowStore())

      act(() => {
        result.current.registerNodeDefinition(mockDefinition)
        result.current.registerNodeDefinition(mockDefinition)
      })

      expect(result.current.definitions).toHaveLength(1)
    })

    it('should set search term', () => {
      const { result } = renderHook(() => useFlowStore())

      act(() => {
        result.current.setSearchTerm('test')
      })

      expect(result.current.searchTerm).toBe('test')
    })

    it('should set selected category', () => {
      const { result } = renderHook(() => useFlowStore())

      act(() => {
        result.current.setSelectedCategory('transform')
      })

      expect(result.current.selectedCategory).toBe('transform')
    })
  })

  describe('Canvas actions', () => {
    it('should add a new node', () => {
      const { result } = renderHook(() => useFlowStore())

      act(() => {
        result.current.addNode(mockDefinition, { x: 100, y: 200 })
      })

      expect(result.current.nodes).toHaveLength(1)
      const node = result.current.nodes[0]
      expect(node.id).toBe('node-1')
      expect(node.type).toBe('test-node')
      expect(node.position).toEqual({ x: 100, y: 200 })
      expect(node.data.definition).toBe(mockDefinition)
      expect(result.current.nextNodeId).toBe(2)
    })

    it('should remove a node and associated edges', () => {
      const { result } = renderHook(() => useFlowStore())

      // Add node first
      act(() => {
        result.current.addNode(mockDefinition, { x: 100, y: 200 })
      })

      const nodeId = result.current.nodes[0].id

      // Add edge
      useFlowStore.setState({
        edges: [{ id: 'edge-1', source: nodeId, target: 'other-node', sourceHandle: null, targetHandle: null }],
        selectedNodes: [nodeId],
      })

      act(() => {
        result.current.removeNode(nodeId)
      })

      expect(result.current.nodes).toHaveLength(0)
      expect(result.current.edges).toHaveLength(0)
      expect(result.current.selectedNodes).toHaveLength(0)
    })

    it('should update node data', () => {
      const { result } = renderHook(() => useFlowStore())

      act(() => {
        result.current.addNode(mockDefinition, { x: 100, y: 200 })
      })

      const nodeId = result.current.nodes[0].id

      act(() => {
        result.current.updateNodeData(nodeId, { label: 'Updated Label' })
      })

      const updatedNode = result.current.nodes[0]
      expect(updatedNode.data.label).toBe('Updated Label')
    })
  })

  describe('Connection validation', () => {
    it('should validate valid connections', () => {
      const { result } = renderHook(() => useFlowStore())

      // Register definition and add nodes
      act(() => {
        result.current.registerNodeDefinition(mockDefinition)
        result.current.addNode(mockDefinition, { x: 0, y: 0 })
        result.current.addNode(mockDefinition, { x: 200, y: 0 })
      })

      const sourceNode = result.current.nodes[0]
      const targetNode = result.current.nodes[1]

      const connection = {
        source: sourceNode.id,
        sourceHandle: 'output1',
        target: targetNode.id,
        targetHandle: 'input1',
      }

      const validation = result.current.validateConnection(connection)
      expect(validation.valid).toBe(true)
    })

    it('should reject connections with incompatible types', () => {
      const { result } = renderHook(() => useFlowStore())

      const numberDefinition: NodeDefinition = {
        ...mockDefinition,
        type: 'number-node',
        outputs: [{ id: 'output1', label: 'Output 1', type: 'number' }],
      }

      act(() => {
        result.current.registerNodeDefinition(mockDefinition)
        result.current.registerNodeDefinition(numberDefinition)
        result.current.addNode(numberDefinition, { x: 0, y: 0 })
        result.current.addNode(mockDefinition, { x: 200, y: 0 })
      })

      const sourceNode = result.current.nodes[0] // number output
      const targetNode = result.current.nodes[1] // string input

      const connection = {
        source: sourceNode.id,
        sourceHandle: 'output1',
        target: targetNode.id,
        targetHandle: 'input1',
      }

      const validation = result.current.validateConnection(connection)
      expect(validation.valid).toBe(false)
      expect(validation.reason).toContain('Type mismatch')
    })

    it('should allow connections with "any" type', () => {
      const { result } = renderHook(() => useFlowStore())

      const anyDefinition: NodeDefinition = {
        ...mockDefinition,
        type: 'any-node',
        inputs: [{ id: 'input1', label: 'Input 1', type: 'any', required: true }],
      }

      act(() => {
        result.current.registerNodeDefinition(mockDefinition)
        result.current.registerNodeDefinition(anyDefinition)
        result.current.addNode(mockDefinition, { x: 0, y: 0 })
        result.current.addNode(anyDefinition, { x: 200, y: 0 })
      })

      const sourceNode = result.current.nodes[0] // string output
      const targetNode = result.current.nodes[1] // any input

      const connection = {
        source: sourceNode.id,
        sourceHandle: 'output1',
        target: targetNode.id,
        targetHandle: 'input1',
      }

      const validation = result.current.validateConnection(connection)
      expect(validation.valid).toBe(true)
    })
  })

  describe('Selection actions', () => {
    it('should set selected nodes', () => {
      const { result } = renderHook(() => useFlowStore())

      act(() => {
        result.current.setSelectedNodes(['node1', 'node2'])
      })

      expect(result.current.selectedNodes).toEqual(['node1', 'node2'])
    })

    it('should clear selection', () => {
      const { result } = renderHook(() => useFlowStore())

      // Set some selection first
      useFlowStore.setState({
        selectedNodes: ['node1'],
        selectedEdges: ['edge1'],
      })

      act(() => {
        result.current.clearSelection()
      })

      expect(result.current.selectedNodes).toEqual([])
      expect(result.current.selectedEdges).toEqual([])
    })
  })

  describe('Drag and drop', () => {
    it('should set dragged node type', () => {
      const { result } = renderHook(() => useFlowStore())

      act(() => {
        result.current.setDraggedNodeType('test-node')
      })

      expect(result.current.draggedNodeType).toBe('test-node')
    })
  })
})
