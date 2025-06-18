import type { StreamConnection, StreamErrorRecovery } from './types';
export declare class DefaultErrorRecovery implements StreamErrorRecovery {
    private options;
    private retryHistory;
    constructor(options?: {
        maxRetries: number;
        baseRetryDelay: number;
        maxRetryDelay: number;
        exponentialBackoff: boolean;
        circuitBreakerThreshold: number;
        circuitBreakerTimeout: number;
    });
    onError(error: Error, connection: StreamConnection): Promise<void>;
    shouldRetry(error: Error, attempt: number): boolean;
    getRetryDelay(attempt: number): number;
    private shouldTriggerCircuitBreaker;
    private triggerCircuitBreaker;
    private getErrorHistory;
    private cleanupOldErrors;
}
export declare class GracefulErrorRecovery implements StreamErrorRecovery {
    private connectionStates;
    onError(error: Error, connection: StreamConnection): Promise<void>;
    shouldRetry(error: Error, attempt: number): boolean;
    getRetryDelay(attempt: number): number;
    private enterDegradedMode;
    private attemptGracefulRecovery;
    private exitDegradedMode;
    private isRecoverableError;
    private clearOldData;
    private reduceMessageFrequency;
    private getConnectionState;
}
