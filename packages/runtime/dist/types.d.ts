export interface NodeDefinition {
    id: string;
    type: string;
    config: Record<string, unknown>;
    inputs: string[];
    outputs: string[];
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    nodes: NodeDefinition[];
    edges: Array<{
        id: string;
        source: string;
        target: string;
        sourcePort: string;
        targetPort: string;
    }>;
}
export interface ExecutionContext {
    workflowId: string;
    nodeId: string;
    inputs: Record<string, unknown>;
    config: Record<string, unknown>;
    emitOutput: (port: string, data: unknown) => void;
    emitError: (error: Error) => void;
}
export interface NodeExecutor {
    type: string;
    execute: (context: ExecutionContext) => Promise<void> | void;
}
export interface ConstraintRule {
    id: string;
    name: string;
    conditions: {
        all?: Array<{
            fact: string;
            operator: string;
            value: unknown;
        }>;
        any?: Array<{
            fact: string;
            operator: string;
            value: unknown;
        }>;
    };
    event: {
        type: string;
        params: Record<string, unknown>;
    };
}
export interface ExecutionEnvironment {
    type: 'browser' | 'service-worker' | 'server';
    capabilities: {
        memory: number;
        cpu: number;
        networkAccess: boolean;
        persistentStorage: boolean;
        backgroundExecution: boolean;
    };
}
