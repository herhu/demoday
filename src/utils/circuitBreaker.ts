export enum CircuitBreakerState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
    failureThreshold: number;
    successThreshold: number;
    timeoutMs: number;
}

export class CircuitBreakerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CircuitBreakerError';
    }
}

export class CircuitBreaker {
    private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
    private failureCount: number = 0;
    private successCount: number = 0;
    private nextAttempt: number = 0;

    private options: CircuitBreakerOptions;
    public name: string;

    constructor(name: string, options?: Partial<CircuitBreakerOptions>) {
        this.name = name;
        this.options = {
            failureThreshold: 3,
            successThreshold: 2,
            timeoutMs: 10000, // 10s default
            ...options
        };
    }

    async execute<T>(action: () => Promise<T>): Promise<T> {
        if (this.state === CircuitBreakerState.OPEN) {
            if (Date.now() > this.nextAttempt) {
                this.state = CircuitBreakerState.HALF_OPEN;
                console.log(`[CircuitBreaker: ${this.name}] Testing connection (HALF_OPEN)`);
            } else {
                throw new CircuitBreakerError(`Circuit ${this.name} is OPEN. Failing fast to prevent cascading failures.`);
            }
        }

        try {
            const result = await action();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        this.failureCount = 0; // Reset failures on any success
        if (this.state === CircuitBreakerState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.options.successThreshold) {
                console.log(`[CircuitBreaker: ${this.name}] Restored (CLOSED)`);
                this.state = CircuitBreakerState.CLOSED;
                this.successCount = 0;
            }
        }
    }

    private onFailure() {
        this.failureCount++;
        if (this.failureCount >= this.options.failureThreshold || this.state === CircuitBreakerState.HALF_OPEN) {
            if (this.state !== CircuitBreakerState.OPEN) {
                console.warn(`[CircuitBreaker: ${this.name}] Tripped (OPEN)`);
            }
            this.state = CircuitBreakerState.OPEN;
            this.nextAttempt = Date.now() + this.options.timeoutMs;
        }
    }

    public getState(): CircuitBreakerState {
        return this.state;
    }
}
