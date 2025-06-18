import React from 'react'
import type { NodePort as NodePortType } from '../../types'
import './NodePort.css'

const typeColors: Record<string, string> = {
  string: '#10b981',
  number: '#3b82f6',
  boolean: '#f59e0b',
  object: '#8b5cf6',
  array: '#06b6d4',
  any: '#64748b',
}

const typeIcons: Record<string, string> = {
  string: 'T',
  number: '#',
  boolean: '✓',
  object: '{}',
  array: '[]',
  any: '*',
}

interface NodePortProps {
  port: NodePortType
  type: 'input' | 'output'
}

export const NodePort: React.FC<NodePortProps> = ({ port, type }) => {
  const typeColor = typeColors[port.type] || '#64748b'
  const typeIcon = typeIcons[port.type] || '?'

  return (
    <div className={`node-port node-port-${type}`}>
      <div className="node-port-info">
        <div className="node-port-label">
          {port.label}
          {port.required && <span className="node-port-required">*</span>}
        </div>
        <div className="node-port-type" style={{ color: typeColor }}>
          <span className="node-port-type-icon">{typeIcon}</span>
          <span className="node-port-type-label">{port.type}</span>
        </div>
      </div>
    </div>
  )
}
