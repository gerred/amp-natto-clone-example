import type { Node } from '@xyflow/react';
export type NodeDataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
export interface NodePort {
    id: string;
    label: string;
    type: NodeDataType;
    required?: boolean;
}
export interface NodeDefinition {
    type: string;
    label: string;
    category: 'input' | 'transform' | 'output' | 'ai' | 'http' | 'filter' | 'merge';
    description: string;
    inputs: NodePort[];
    outputs: NodePort[];
    config?: Record<string, unknown>;
    icon?: string;
}
export interface FlowNodeData extends Record<string, unknown> {
    label: string;
    definition: NodeDefinition;
    config: Record<string, unknown>;
    inputs: NodePort[];
    outputs: NodePort[];
}
export type FlowNode = Node<FlowNodeData>;
export interface CustomNodeProps {
    data: FlowNodeData;
    selected: boolean;
}
export interface ConnectionValidation {
    sourceNodeId: string;
    sourcePortId: string;
    targetNodeId: string;
    targetPortId: string;
    valid: boolean;
    reason?: string;
}
