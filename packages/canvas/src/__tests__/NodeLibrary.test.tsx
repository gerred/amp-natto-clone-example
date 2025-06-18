import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NodeLibrary } from '../components/NodeLibrary'
import { useFlowStore } from '../store/flow-store'
import type { NodeDefinition } from '../types'

// Mock the store
jest.mock('../store/flow-store')

const mockDefinitions: NodeDefinition[] = [
  {
    type: 'test-input',
    label: 'Test Input',
    category: 'input',
    description: 'A test input node',
    inputs: [],
    outputs: [{ id: 'out', label: 'Output', type: 'string' }],
  },
  {
    type: 'test-transform',
    label: 'Test Transform',
    category: 'transform',
    description: 'A test transform node',
    inputs: [{ id: 'in', label: 'Input', type: 'string', required: true }],
    outputs: [{ id: 'out', label: 'Output', type: 'string' }],
  },
]

const mockStore = {
  definitions: mockDefinitions,
  categories: ['input', 'transform'],
  searchTerm: '',
  selectedCategory: null,
  setSearchTerm: jest.fn(),
  setSelectedCategory: jest.fn(),
  setDraggedNodeType: jest.fn(),
}

beforeEach(() => {
  ;(useFlowStore as jest.Mock).mockReturnValue(mockStore)
  jest.clearAllMocks()
})

describe('NodeLibrary', () => {
  it('renders without crashing', () => {
    render(<NodeLibrary />)
    expect(screen.getByText('Node Library')).toBeInTheDocument()
  })

  it('displays all node definitions', () => {
    render(<NodeLibrary />)
    expect(screen.getByText('Test Input')).toBeInTheDocument()
    expect(screen.getByText('Test Transform')).toBeInTheDocument()
  })

  it('filters nodes by search term', () => {
    const setSearchTermSpy = jest.fn()
    ;(useFlowStore as jest.Mock).mockReturnValue({
      ...mockStore,
      setSearchTerm: setSearchTermSpy,
    })

    render(<NodeLibrary />)
    
    const searchInput = screen.getByPlaceholderText('Search nodes...')
    fireEvent.change(searchInput, { target: { value: 'input' } })
    
    expect(setSearchTermSpy).toHaveBeenCalledWith('input')
  })

  it('filters nodes by category', () => {
    const setSelectedCategorySpy = jest.fn()
    ;(useFlowStore as jest.Mock).mockReturnValue({
      ...mockStore,
      setSelectedCategory: setSelectedCategorySpy,
    })

    render(<NodeLibrary />)
    
    const inputCategory = screen.getByText('Input')
    fireEvent.click(inputCategory)
    
    expect(setSelectedCategorySpy).toHaveBeenCalledWith('input')
  })

  it('shows correct node counts per category', () => {
    render(<NodeLibrary />)
    expect(screen.getByText('All (2)')).toBeInTheDocument()
    expect(screen.getByText('(1)', { exact: false })).toBeInTheDocument() // Each category has 1 node
  })

  it('handles drag start events', () => {
    const setDraggedNodeTypeSpy = jest.fn()
    ;(useFlowStore as jest.Mock).mockReturnValue({
      ...mockStore,
      setDraggedNodeType: setDraggedNodeTypeSpy,
    })

    render(<NodeLibrary />)
    
    const nodeItem = screen.getByText('Test Input').closest('.node-library-item')
    expect(nodeItem).toBeInTheDocument()
    
    const dragEvent = new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer: new DataTransfer(),
    })
    
    fireEvent(nodeItem!, dragEvent)
    
    expect(setDraggedNodeTypeSpy).toHaveBeenCalledWith('test-input')
  })

  it('clears drag state on drag end', () => {
    const setDraggedNodeTypeSpy = jest.fn()
    ;(useFlowStore as jest.Mock).mockReturnValue({
      ...mockStore,
      setDraggedNodeType: setDraggedNodeTypeSpy,
    })

    render(<NodeLibrary />)
    
    const library = document.querySelector('.node-library')
    fireEvent.dragEnd(library!)
    
    expect(setDraggedNodeTypeSpy).toHaveBeenCalledWith(null)
  })

  it('shows empty state when no nodes match search', () => {
    ;(useFlowStore as jest.Mock).mockReturnValue({
      ...mockStore,
      searchTerm: 'nonexistent',
      definitions: [], // Simulate filtered empty result
    })

    render(<NodeLibrary />)
    expect(screen.getByText('No nodes match your search')).toBeInTheDocument()
  })
})
