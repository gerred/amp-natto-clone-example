import { buildSchema } from 'graphql';

export const createGraphQLSchema = () =>
  buildSchema(`
  type Node {
    id: ID!
    type: String!
    position: Position!
    data: NodeData!
  }

  type Position {
    x: Float!
    y: Float!
  }

  type NodeData {
    label: String!
    inputs: [String!]
    outputs: [String!]
    config: JSON
  }

  type Edge {
    id: ID!
    source: ID!
    target: ID!
    sourceHandle: String
    targetHandle: String
    animated: Boolean
    data: EdgeData
  }

  type EdgeData {
    streamActive: Boolean
    messageCount: Int
  }

  type Workflow {
    id: ID!
    name: String!
    description: String
    nodes: [Node!]!
    edges: [Edge!]!
    createdAt: String
    updatedAt: String
  }

  input NodeInput {
    type: String!
    position: PositionInput!
    data: NodeDataInput!
  }

  input PositionInput {
    x: Float!
    y: Float!
  }

  input NodeDataInput {
    label: String!
    inputs: [String!]
    outputs: [String!]
    config: JSON
  }

  input EdgeInput {
    source: ID!
    target: ID!
    sourceHandle: String
    targetHandle: String
    animated: Boolean
  }

  input WorkflowInput {
    name: String!
    description: String
    nodes: [NodeInput!]!
    edges: [EdgeInput!]!
  }

  type Query {
    workflow(id: ID!): Workflow
    workflows(page: Int, pageSize: Int): [Workflow!]!
  }

  type Mutation {
    createWorkflow(input: WorkflowInput!): Workflow!
    updateWorkflow(id: ID!, input: WorkflowInput!): Workflow!
    deleteWorkflow(id: ID!): Boolean!
    executeWorkflow(id: ID!): Boolean!
    stopWorkflow(id: ID!): Boolean!
  }

  type Subscription {
    workflowStatus(id: ID!): WorkflowStatus!
    nodeOutput(workflowId: ID!, nodeId: ID!): NodeOutput!
  }

  type WorkflowStatus {
    id: ID!
    status: ExecutionStatus!
    startedAt: String
    completedAt: String
    error: String
  }

  type NodeOutput {
    nodeId: ID!
    port: String!
    data: JSON!
    timestamp: String!
  }

  enum ExecutionStatus {
    IDLE
    RUNNING
    COMPLETED
    FAILED
  }

  scalar JSON
`);
