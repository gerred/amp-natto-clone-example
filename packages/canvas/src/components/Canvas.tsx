import React, { useCallback, useMemo, useRef } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,

  SelectionMode,
  OnSelectionChangeParams,

  Node,
  ReactFlowInstance,
  ConnectionLineType,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useFlowStore } from '../store/flow-store'
import { CustomNode } from './nodes/CustomNode'
import { NodeLibrary } from './NodeLibrary'
import type { FlowNodeData } from '../types'
import './Canvas.css'

const nodeTypes = {
  custom: CustomNode as any,
}

interface CanvasProps {
  className?: string
  showLibrary?: boolean
  onNodeClick?: (event: React.MouseEvent, node: Node<FlowNodeData>) => void
  onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void
}

export const Canvas: React.FC<CanvasProps> = ({
  className = '',
  showLibrary = true,
  onNodeClick,
  onEdgeClick,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const {
    nodes,
    edges,
    selectedNodes,
    selectedEdges,
    addNode,
    removeNode,
    addEdge: addStoreEdge,
    removeEdge,
    setSelectedNodes,
    setSelectedEdges,
    clearSelection,
    validateConnection,
    setDraggedNodeType,
    definitions,
  } = useFlowStore()

  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(nodes)
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(edges)
  const [reactFlowInstance, setReactFlowInstance] = 
    React.useState<ReactFlowInstance | null>(null)

  // Sync store with React Flow state
  React.useEffect(() => {
    setNodes(nodes)
  }, [nodes, setNodes])

  React.useEffect(() => {
    setEdges(edges)
  }, [edges, setEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      const validation = validateConnection(connection)
      if (validation.valid) {
        const newEdge = {
          ...connection,
          id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
          type: 'smoothstep' as const,
          markerEnd: { type: MarkerType.ArrowClosed },
          animated: false,
        }
        setEdges((eds: Edge[]) => addEdge(newEdge as Edge, eds))
        addStoreEdge(connection)
      }
    },
    [validateConnection, addStoreEdge, setEdges]
  )

  const onNodeDragStop = useCallback(
    (_event: any, _node: any, _nodes: any) => {
      // Handle node position updates if needed
    },
    []
  )

  const onSelectionChange = useCallback(
    ({ nodes, edges }: OnSelectionChangeParams) => {
      setSelectedNodes(nodes.map((n) => n.id))
      setSelectedEdges(edges.map((e) => e.id))
    },
    [setSelectedNodes, setSelectedEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const nodeType = event.dataTransfer.getData('application/reactflow')
      const definition = definitions.find((d: { type: string }) => d.type === nodeType)

      if (!definition || !reactFlowInstance) return

      const bounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!bounds) return

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      addNode(definition, position)
      setDraggedNodeType(null)
    },
    [reactFlowInstance, definitions, addNode, setDraggedNodeType]
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Delete selected nodes and edges
        selectedNodes.forEach((nodeId: string) => removeNode(nodeId))
        selectedEdges.forEach((edgeId: string) => removeEdge(edgeId))
        clearSelection()
      }
    },
    [selectedNodes, selectedEdges, removeNode, removeEdge, clearSelection]
  )

  const connectionLineStyle = useMemo(
    () => ({
      strokeWidth: 2,
      stroke: '#3b82f6',
    }),
    []
  )

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 2, stroke: '#64748b' },
    }),
    []
  )

  return (
    <div className={`canvas-container ${className}`}>
      {showLibrary && <NodeLibrary />}
      <div className="canvas-main" ref={reactFlowWrapper} tabIndex={0} onKeyDown={onKeyDown}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={reactFlowNodes}
            edges={reactFlowEdges}
            onNodesChange={onNodesChange as any}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeDragStop={onNodeDragStop}
            onSelectionChange={onSelectionChange}
            onNodeClick={onNodeClick as any}
            onEdgeClick={onEdgeClick as any}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionLineStyle={connectionLineStyle}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            selectNodesOnDrag={false}
            selectionMode={SelectionMode.Partial}
            multiSelectionKeyCode="Shift"
            deleteKeyCode={['Delete', 'Backspace']}
            snapToGrid={true}
            snapGrid={[16, 16]}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#64748b" gap={16} />
            <Controls />
            <MiniMap
              nodeColor="#e2e8f0"
              maskColor="rgba(0, 0, 0, 0.2)"
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  )
}
