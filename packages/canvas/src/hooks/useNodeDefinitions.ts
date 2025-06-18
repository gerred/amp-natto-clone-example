import { useEffect } from 'react'
import { useFlowStore } from '../store/flow-store'
import { ALL_NODE_DEFINITIONS } from '../components/nodes/node-types'

export const useNodeDefinitions = () => {
  const { registerNodeDefinition, definitions } = useFlowStore()

  useEffect(() => {
    // Register all predefined node types
    ALL_NODE_DEFINITIONS.forEach((definition) => {
      registerNodeDefinition(definition)
    })
  }, [registerNodeDefinition])

  return {
    definitions,
    registerNodeDefinition,
  }
}
