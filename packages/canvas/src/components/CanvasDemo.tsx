import React, { useEffect } from 'react'
import { Canvas } from './Canvas'
import { useNodeDefinitions } from '../hooks/useNodeDefinitions'
import { useFlowStore } from '../store/flow-store'
import './CanvasDemo.css'

export const CanvasDemo: React.FC = () => {
  // Initialize node definitions
  useNodeDefinitions()
  
  const { addNode, definitions } = useFlowStore()

  // Add some example nodes on mount
  useEffect(() => {
    if (definitions.length > 0) {
      // Add a text input node
      const textInputDef = definitions.find((d: { type: string }) => d.type === 'text-input')
      if (textInputDef) {
        addNode(textInputDef, { x: 100, y: 100 })
      }

      // Add a text transform node
      const textTransformDef = definitions.find((d: { type: string }) => d.type === 'text-transform')
      if (textTransformDef) {
        addNode(textTransformDef, { x: 400, y: 100 })
      }

      // Add a console output node
      const consoleOutputDef = definitions.find((d: { type: string }) => d.type === 'console-output')
      if (consoleOutputDef) {
        addNode(consoleOutputDef, { x: 700, y: 100 })
      }

      // Add an AI node
      const openaiChatDef = definitions.find((d: { type: string }) => d.type === 'openai-chat')
      if (openaiChatDef) {
        addNode(openaiChatDef, { x: 250, y: 300 })
      }

      // Add an HTTP request node
      const httpRequestDef = definitions.find((d: { type: string }) => d.type === 'http-request')
      if (httpRequestDef) {
        addNode(httpRequestDef, { x: 550, y: 300 })
      }
    }
  }, [definitions.length, addNode, definitions])

  const handleNodeClick = (_event: React.MouseEvent, node: any) => {
    console.log('Node clicked:', node)
  }

  const handleEdgeClick = (_event: React.MouseEvent, edge: any) => {
    console.log('Edge clicked:', edge)
  }

  return (
    <div className="canvas-demo">
      <div className="canvas-demo-header">
        <h1>Node Flow Canvas Demo</h1>
        <p>
          Drag nodes from the library to create your flow. Click and drag to connect compatible ports.
          Use keyboard shortcuts: Delete/Backspace to remove selected nodes and edges.
        </p>
        <div className="canvas-demo-stats">
          <span>Available Nodes: {definitions.length}</span>
          <span>Categories: {new Set(definitions.map((d: { category: string }) => d.category)).size}</span>
        </div>
      </div>
      <div className="canvas-demo-container">
        <Canvas
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          className="demo-canvas"
        />
      </div>
    </div>
  )
}
