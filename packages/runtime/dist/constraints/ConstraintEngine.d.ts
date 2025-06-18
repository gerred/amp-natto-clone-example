import type { ConstraintRule, ExecutionEnvironment } from '../types';
export declare class ConstraintEngine {
    private engine;
    addRule(rule: ConstraintRule): void;
    selectExecutionEnvironment(environments: ExecutionEnvironment[], workflowRequirements: Record<string, unknown>): Promise<ExecutionEnvironment>;
    validateWorkflow(workflow: unknown, environment: ExecutionEnvironment): Promise<{
        valid: boolean;
        violations: string[];
    }>;
}
