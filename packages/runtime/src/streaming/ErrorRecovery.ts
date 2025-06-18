import type { StreamConnection, StreamErrorRecovery } from './types';

export class DefaultErrorRecovery implements StreamErrorRecovery {
  private retryHistory = new Map<string, number[]>();

  constructor(
    private options: {
      maxRetries: number;
      baseRetryDelay: number;
      maxRetryDelay: number;
      exponentialBackoff: boolean;
      circuitBreakerThreshold: number;
      circuitBreakerTimeout: number;
    } = {
      maxRetries: 3,
      baseRetryDelay: 100,
      maxRetryDelay: 5000,
      exponentialBackoff: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 30000
    }
  ) {}

  async onError(error: Error, connection: StreamConnection): Promise<void> {
    const errorKey = `${connection.id}:${error.name}`;
    const history = this.getErrorHistory(errorKey);
    
    console.error(`Stream error on connection ${connection.id}:`, error.message);
    
    // Check if circuit breaker should be triggered
    if (this.shouldTriggerCircuitBreaker(history)) {
      console.warn(`Circuit breaker triggered for connection ${connection.id}`);
      await this.triggerCircuitBreaker(connection);
      return;
    }

    // Record error for circuit breaker logic
    history.push(Date.now());
    this.cleanupOldErrors(history);
  }

  shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.options.maxRetries) {
      return false;
    }

    // Don't retry certain error types
    const nonRetryableErrors = [
      'AbortError',
      'TypeError', // Usually indicates programming error
      'SyntaxError'
    ];

    if (nonRetryableErrors.includes(error.name)) {
      return false;
    }

    // Don't retry if circuit breaker is open
    const errorKey = `circuit-breaker:${error.name}`;
    const breakerHistory = this.getErrorHistory(errorKey);
    if (breakerHistory.length > 0) {
      const lastBreaker = breakerHistory[breakerHistory.length - 1];
      if (lastBreaker && Date.now() - lastBreaker < this.options.circuitBreakerTimeout) {
        return false;
      }
    }

    return true;
  }

  getRetryDelay(attempt: number): number {
    if (!this.options.exponentialBackoff) {
      return this.options.baseRetryDelay;
    }

    const delay = this.options.baseRetryDelay * Math.pow(2, attempt);
    return Math.min(delay, this.options.maxRetryDelay);
  }

  private shouldTriggerCircuitBreaker(errorHistory: number[]): boolean {
    if (errorHistory.length < this.options.circuitBreakerThreshold) {
      return false;
    }

    // Check if we have too many errors in a short time window
    const windowSize = 60000; // 1 minute
    const now = Date.now();
    const recentErrors = errorHistory.filter(timestamp => now - timestamp < windowSize);
    
    return recentErrors.length >= this.options.circuitBreakerThreshold;
  }

  private async triggerCircuitBreaker(connection: StreamConnection): Promise<void> {
    const errorKey = `circuit-breaker:${connection.id}`;
    const history = this.getErrorHistory(errorKey);
    history.push(Date.now());

    // Emit circuit breaker event
    console.warn(`Circuit breaker open for connection ${connection.id}, timeout: ${this.options.circuitBreakerTimeout}ms`);
    
    // Could emit to event system here for monitoring
  }

  private getErrorHistory(key: string): number[] {
    if (!this.retryHistory.has(key)) {
      this.retryHistory.set(key, []);
    }
    return this.retryHistory.get(key)!;
  }

  private cleanupOldErrors(history: number[]): void {
    const cutoff = Date.now() - 300000; // 5 minutes
    const cleaned = history.filter(timestamp => timestamp > cutoff);
    history.length = 0;
    history.push(...cleaned);
  }
}

export class GracefulErrorRecovery implements StreamErrorRecovery {
  private connectionStates = new Map<string, {
    isHealthy: boolean;
    degradedMode: boolean;
    lastError: number;
    errorCount: number;
  }>();

  async onError(error: Error, connection: StreamConnection): Promise<void> {
    const state = this.getConnectionState(connection.id);
    state.lastError = Date.now();
    state.errorCount++;

    // Determine if we should enter degraded mode
    if (state.errorCount > 2 && !state.degradedMode) {
      await this.enterDegradedMode(connection);
    }

    // Try to recover gracefully
    if (this.isRecoverableError(error)) {
      await this.attemptGracefulRecovery(connection, error);
    }
  }

  shouldRetry(error: Error, attempt: number): boolean {
    const maxAttempts = this.isRecoverableError(error) ? 5 : 2;
    return attempt < maxAttempts;
  }

  getRetryDelay(attempt: number): number {
    // Gentle exponential backoff with jitter
    const baseDelay = 200;
    const jitter = Math.random() * 100;
    return baseDelay * Math.pow(1.5, attempt) + jitter;
  }

  private async enterDegradedMode(connection: StreamConnection): Promise<void> {
    const state = this.getConnectionState(connection.id);
    state.degradedMode = true;
    state.isHealthy = false;

    console.warn(`Connection ${connection.id} entering degraded mode`);
    
    // Reduce throughput, increase buffers, etc.
    connection.config.batchTimeout = Math.min(connection.config.batchTimeout * 2, 1000);
    connection.config.maxBatchSize = Math.max(connection.config.maxBatchSize / 2, 1);
  }

  private async attemptGracefulRecovery(connection: StreamConnection, error: Error): Promise<void> {
    const state = this.getConnectionState(connection.id);
    
    // Recovery strategies based on error type
    if (error.name === 'QuotaExceededError') {
      // Storage issues - clear old data
      await this.clearOldData(connection);
    } else if (error.name === 'NetworkError') {
      // Network issues - reduce message frequency
      await this.reduceMessageFrequency(connection);
    } else if (error.message.includes('backpressure')) {
      // Backpressure - increase batch size
      connection.config.maxBatchSize = Math.min(connection.config.maxBatchSize * 1.5, 200);
    }

    // Check if we can exit degraded mode
    const timeSinceLastError = Date.now() - state.lastError;
    if (state.degradedMode && timeSinceLastError > 30000) { // 30 seconds
      await this.exitDegradedMode(connection);
    }
  }

  private async exitDegradedMode(connection: StreamConnection): Promise<void> {
    const state = this.getConnectionState(connection.id);
    state.degradedMode = false;
    state.isHealthy = true;
    state.errorCount = 0;

    console.info(`Connection ${connection.id} exiting degraded mode`);
    
    // Restore original configuration
    // In a real implementation, we'd store the original config
    connection.config.batchTimeout = 16;
    connection.config.maxBatchSize = 50;
  }

  private isRecoverableError(error: Error): boolean {
    const recoverableErrors = [
      'QuotaExceededError',
      'NetworkError',
      'TimeoutError',
      'DataCloneError'
    ];
    
    return recoverableErrors.some(type => 
      error.name === type || error.message.includes(type.toLowerCase())
    );
  }

  private async clearOldData(connection: StreamConnection): Promise<void> {
    // Implementation would clear old buffered data
    console.info(`Clearing old data for connection ${connection.id}`);
  }

  private async reduceMessageFrequency(connection: StreamConnection): Promise<void> {
    connection.config.batchTimeout = Math.min(connection.config.batchTimeout * 1.5, 500);
    console.info(`Reduced message frequency for connection ${connection.id}`);
  }

  private getConnectionState(connectionId: string) {
    if (!this.connectionStates.has(connectionId)) {
      this.connectionStates.set(connectionId, {
        isHealthy: true,
        degradedMode: false,
        lastError: 0,
        errorCount: 0
      });
    }
    return this.connectionStates.get(connectionId)!;
  }
}
