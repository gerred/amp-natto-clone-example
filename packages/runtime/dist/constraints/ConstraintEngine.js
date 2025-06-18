import { Engine } from 'json-rules-engine';
export class ConstraintEngine {
    engine = new Engine();
    addRule(rule) {
        this.engine.addRule({
            conditions: rule.conditions,
            event: rule.event,
        });
    }
    async selectExecutionEnvironment(environments, workflowRequirements) {
        // Default to browser if no rules match
        let selectedEnvironment = environments.find((env) => env.type === 'browser') || environments[0];
        if (!selectedEnvironment) {
            throw new Error('No execution environments available');
        }
        for (const environment of environments) {
            const facts = {
                ...workflowRequirements,
                environmentType: environment.type,
                availableMemory: environment.capabilities.memory,
                availableCpu: environment.capabilities.cpu,
                hasNetworkAccess: environment.capabilities.networkAccess,
                hasPersistentStorage: environment.capabilities.persistentStorage,
                supportsBackgroundExecution: environment.capabilities.backgroundExecution,
            };
            const { events } = await this.engine.run(facts);
            if (events.length > 0) {
                const selectEvent = events.find((event) => event.type === 'select-environment');
                if (selectEvent && selectEvent.params?.environmentType === environment.type) {
                    selectedEnvironment = environment;
                    break;
                }
            }
        }
        return selectedEnvironment;
    }
    async validateWorkflow(workflow, environment) {
        const violations = [];
        const facts = {
            nodeCount: Array.isArray(workflow?.nodes) ? workflow.nodes.length : 0,
            environmentType: environment.type,
            availableMemory: environment.capabilities.memory,
            supportsBackgroundExecution: environment.capabilities.backgroundExecution,
        };
        try {
            const { events } = await this.engine.run(facts);
            for (const event of events) {
                if (event.type === 'constraint-violation') {
                    violations.push(event.params?.message || 'Unknown violation');
                }
            }
        }
        catch (error) {
            violations.push(`Validation error: ${error}`);
        }
        return {
            valid: violations.length === 0,
            violations,
        };
    }
}
