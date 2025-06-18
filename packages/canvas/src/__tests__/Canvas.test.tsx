import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Canvas } from '../components/Canvas'
import { useFlowStore } from '../store/flow-store'

// Mock React Flow
jest.mock('@xyflow/react', () => ({
  ReactFlow: ({ children, ...props }: any) => (
    <div data-testid="react-flow" {...props}>
      {children}
    </div>
  ),
  ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
  addEdge: jest.fn(),
  ConnectionLineType: { SmoothStep: 'smoothstep' },
  MarkerType: { ArrowClosed: 'arrowclosed' },
  SelectionMode: { Partial: 'partial' },
  Position: { Left: 'left', Right: 'right' },
}))

// Mock the store
jest.mock('../store/flow-store')

const mockStore = {
  nodes: [],
  edges: [],
  selectedNodes: [],
  selectedEdges: [],
  addNode: jest.fn(),
  removeNode: jest.fn(),
  addEdge: jest.fn(),
  removeEdge: jest.fn(),
  setSelectedNodes: jest.fn(),
  setSelectedEdges: jest.fn(),
  clearSelection: jest.fn(),
  validateConnection: jest.fn(() => ({ valid: true })),
  draggedNodeType: null,
  setDraggedNodeType: jest.fn(),
  definitions: [],
}

beforeEach(() => {
  ;(useFlowStore as jest.Mock).mockReturnValue(mockStore)
})

describe('Canvas', () => {
  it('renders without crashing', () => {
    render(<Canvas />)
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
  })

  it('renders with node library by default', () => {
    render(<Canvas />)
    expect(screen.getByText('Node Library')).toBeInTheDocument()
  })

  it('can hide node library', () => {
    render(<Canvas showLibrary={false} />)
    expect(screen.queryByText('Node Library')).not.toBeInTheDocument()
  })

  it('handles keyboard events for deletion', () => {
    const removeNodeSpy = jest.fn()
    const removeEdgeSpy = jest.fn()
    const clearSelectionSpy = jest.fn()

    ;(useFlowStore as jest.Mock).mockReturnValue({
      ...mockStore,
      selectedNodes: ['node1'],
      selectedEdges: ['edge1'],
      removeNode: removeNodeSpy,
      removeEdge: removeEdgeSpy,
      clearSelection: clearSelectionSpy,
    })

    render(<Canvas />)
    
    const canvasMain = document.querySelector('.canvas-main')
    expect(canvasMain).toBeInTheDocument()
    
    fireEvent.keyDown(canvasMain!, { key: 'Delete' })
    
    expect(removeNodeSpy).toHaveBeenCalledWith('node1')
    expect(removeEdgeSpy).toHaveBeenCalledWith('edge1')
    expect(clearSelectionSpy).toHaveBeenCalled()
  })

  it('accepts custom className', () => {
    render(<Canvas className="custom-class" />)
    expect(document.querySelector('.canvas-container.custom-class')).toBeInTheDocument()
  })
})
