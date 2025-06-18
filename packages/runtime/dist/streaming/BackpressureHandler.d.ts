import type { StreamMessage, StreamConnection, StreamBackpressureHandler } from './types';
export declare class DefaultBackpressureHandler implements StreamBackpressureHandler {
    private options;
    private priorityWeights;
    constructor(options?: {
        dropThreshold: number;
        priorityDrop: boolean;
        maxWaitTime: number;
    });
    setPriorityWeight(nodeType: string, weight: number): void;
    onBackpressure(connection: StreamConnection): Promise<void>;
    shouldDropMessage(message: StreamMessage): boolean;
    prioritizeMessage(message: StreamMessage): number;
    private calculateBufferUtilization;
    private sleep;
}
export declare class AdaptiveBackpressureHandler implements StreamBackpressureHandler {
    private connectionStates;
    onBackpressure(connection: StreamConnection): Promise<void>;
    shouldDropMessage(message: StreamMessage): boolean;
    prioritizeMessage(message: StreamMessage): number;
    private getConnectionState;
    private sleep;
}
