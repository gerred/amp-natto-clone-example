import { Engine } from 'json-rules-engine';
import type { ConstraintRule, ExecutionEnvironment } from '../types';

export class ConstraintEngine {
  private engine = new Engine();

  addRule(rule: ConstraintRule): void {
    this.engine.addRule({
      conditions: rule.conditions as any,
      event: rule.event,
    });
  }

  async selectExecutionEnvironment(
    environments: ExecutionEnvironment[],
    workflowRequirements: Record<string, unknown>
  ): Promise<ExecutionEnvironment> {
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

  async validateWorkflow(
    workflow: unknown,
    environment: ExecutionEnvironment
  ): Promise<{ valid: boolean; violations: string[] }> {
    const violations: string[] = [];

    const facts = {
      nodeCount: Array.isArray((workflow as any)?.nodes) ? (workflow as any).nodes.length : 0,
      environmentType: environment.type,
      availableMemory: environment.capabilities.memory,
      supportsBackgroundExecution: environment.capabilities.backgroundExecution,
    };

    try {
      const { events } = await this.engine.run(facts);

      for (const event of events) {
        if (event.type === 'constraint-violation') {
          violations.push((event.params?.message as string) || 'Unknown violation');
        }
      }
    } catch (error) {
      violations.push(`Validation error: ${error}`);
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }
}
