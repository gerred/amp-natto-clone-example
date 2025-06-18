import React, { useMemo } from 'react'
import { useFlowStore } from '../store/flow-store'
import type { NodeDefinition } from '../types'
import './NodeLibrary.css'

const categoryIcons: Record<string, string> = {
  input: '📥',
  transform: '⚙️',
  output: '📤',
  ai: '🤖',
  http: '🌐',
  filter: '🔍',
  merge: '🔀',
}

const categoryLabels: Record<string, string> = {
  input: 'Input',
  transform: 'Transform',
  output: 'Output',
  ai: 'AI/LLM',
  http: 'HTTP',
  filter: 'Filter',
  merge: 'Merge',
}

interface NodeLibraryItemProps {
  definition: NodeDefinition
  onDragStart: (event: React.DragEvent, nodeType: string) => void
}

const NodeLibraryItem: React.FC<NodeLibraryItemProps> = ({ definition, onDragStart }) => {
  return (
    <div
      className="node-library-item"
      draggable
      onDragStart={(event) => onDragStart(event, definition.type)}
      title={definition.description}
    >
      <div className="node-library-item-icon">
        {definition.icon || categoryIcons[definition.category] || '📦'}
      </div>
      <div className="node-library-item-content">
        <div className="node-library-item-label">{definition.label}</div>
        <div className="node-library-item-description">{definition.description}</div>
      </div>
    </div>
  )
}

export const NodeLibrary: React.FC = () => {
  const {
    definitions,
    categories,
    searchTerm,
    selectedCategory,
    setSearchTerm,
    setSelectedCategory,
    setDraggedNodeType,
  } = useFlowStore()

  const filteredDefinitions = useMemo(() => {
    let filtered = [...definitions]

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((def: NodeDefinition) => def.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (def: NodeDefinition) =>
          def.label.toLowerCase().includes(term) ||
          def.description.toLowerCase().includes(term) ||
          def.type.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [definitions, selectedCategory, searchTerm])

  const groupedDefinitions = useMemo(() => {
    const grouped: Record<string, NodeDefinition[]> = {}
    
    filteredDefinitions.forEach((def: NodeDefinition) => {
      if (!grouped[def.category]) {
        grouped[def.category] = []
      }
      grouped[def.category]!.push(def)
    })

    return grouped
  }, [filteredDefinitions])

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
    setDraggedNodeType(nodeType)
  }

  const onDragEnd = () => {
    setDraggedNodeType(null)
  }

  return (
    <div className="node-library" onDragEnd={onDragEnd}>
      <div className="node-library-header">
        <h3>Node Library</h3>
        <div className="node-library-search">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="node-library-search-input"
          />
        </div>
      </div>

      <div className="node-library-categories">
        <button
          className={`node-library-category ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All ({definitions.length})
        </button>
        {categories.map((category: string) => {
          const count = definitions.filter((def: NodeDefinition) => def.category === category).length
          return (
            <button
              key={category}
              className={`node-library-category ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              <span className="node-library-category-icon">
                {categoryIcons[category] || '📦'}
              </span>
              <span className="node-library-category-label">
                {categoryLabels[category] || category}
              </span>
              <span className="node-library-category-count">({count})</span>
            </button>
          )
        })}
      </div>

      <div className="node-library-content">
        {Object.keys(groupedDefinitions).length === 0 ? (
          <div className="node-library-empty">
            {searchTerm ? 'No nodes match your search' : 'No nodes available'}
          </div>
        ) : (
          Object.entries(groupedDefinitions).map(([category, nodes]) => (
            <div key={category} className="node-library-section">
              {!selectedCategory && (
                <h4 className="node-library-section-title">
                  <span className="node-library-section-icon">
                    {categoryIcons[category] || '📦'}
                  </span>
                  {categoryLabels[category] || category}
                </h4>
              )}
              <div className="node-library-items">
                {(nodes as NodeDefinition[]).map((definition: NodeDefinition) => (
                  <NodeLibraryItem
                    key={definition.type}
                    definition={definition}
                    onDragStart={onDragStart}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
