import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { CustomNodeProps, FlowNodeData } from '../../types'
import { NodePort } from './NodePort'
import './CustomNode.css'

const categoryColors: Record<string, string> = {
  input: '#10b981',
  transform: '#3b82f6',
  output: '#f59e0b',
  ai: '#8b5cf6',
  http: '#06b6d4',
  filter: '#ef4444',
  merge: '#84cc16',
}

const categoryIcons: Record<string, string> = {
  input: '📥',
  transform: '⚙️',
  output: '📤',
  ai: '🤖',
  http: '🌐',
  filter: '🔍',
  merge: '🔀',
}

export const CustomNode: React.FC<CustomNodeProps> = memo(({ data, selected }) => {
  const { definition, inputs, outputs } = data as FlowNodeData
  const categoryColor = categoryColors[definition.category] || '#64748b'
  const categoryIcon = definition.icon || categoryIcons[definition.category] || '📦'

  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      {/* Input handles */}
      {inputs.map((input: any, index: number) => (
        <Handle
          key={`input-${input.id}`}
          type="target"
          position={Position.Left}
          id={input.id}
          style={{
            top: `${20 + (index * 24)}px`,
            background: '#64748b',
          }}
          className="node-handle"
        />
      ))}

      {/* Output handles */}
      {outputs.map((output: any, index: number) => (
        <Handle
          key={`output-${output.id}`}
          type="source"
          position={Position.Right}
          id={output.id}
          style={{
            top: `${20 + (index * 24)}px`,
            background: categoryColor,
          }}
          className="node-handle"
        />
      ))}

      {/* Node header */}
      <div className="custom-node-header" style={{ borderTopColor: categoryColor }}>
        <div className="custom-node-icon">{categoryIcon}</div>
        <div className="custom-node-title">{(data as FlowNodeData).label}</div>
        <div className="custom-node-category-badge" style={{ backgroundColor: categoryColor }}>
          {definition.category}
        </div>
      </div>

      {/* Node body */}
      <div className="custom-node-body">
        {/* Input ports */}
        {inputs.length > 0 && (
          <div className="custom-node-ports">
            <div className="custom-node-ports-section">
              <div className="custom-node-ports-title">Inputs</div>
              {inputs.map((input: any) => (
                <NodePort key={input.id} port={input} type="input" />
              ))}
            </div>
          </div>
        )}

        {/* Output ports */}
        {outputs.length > 0 && (
          <div className="custom-node-ports">
            <div className="custom-node-ports-section">
              <div className="custom-node-ports-title">Outputs</div>
              {outputs.map((output: any) => (
                <NodePort key={output.id} port={output} type="output" />
              ))}
            </div>
          </div>
        )}

        {/* Configuration preview */}
        {Object.keys((data as FlowNodeData).config).length > 0 && (
          <div className="custom-node-config">
            <div className="custom-node-config-title">Configuration</div>
            <div className="custom-node-config-items">
              {Object.entries((data as FlowNodeData).config).slice(0, 2).map(([key, value]) => (
                <div key={key} className="custom-node-config-item">
                  <span className="custom-node-config-key">{key}:</span>
                  <span className="custom-node-config-value">
                    {String(value).length > 20 
                      ? `${String(value).substring(0, 20)}...` 
                      : String(value)
                    }
                  </span>
                </div>
              ))}
              {Object.keys((data as FlowNodeData).config).length > 2 && (
                <div className="custom-node-config-more">
                  +{Object.keys((data as FlowNodeData).config).length - 2} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

CustomNode.displayName = 'CustomNode'
