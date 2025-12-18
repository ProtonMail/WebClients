import { traceError } from '../helpers/sentry';

export class ApiRateLimiter {
    private enabled: boolean;
    private maxRequests: number;
    private tracingEnabled: boolean;
    private urlTimestamps: Map<string, number[]>;
    private windowMs: number;

    // Default values are set to 10 requests per second for the same URL
    constructor({
        enabled = false,
        maxRequests = 100,
        windowMs = 1000,
        tracingEnabled = true,
    }: { enabled?: boolean; maxRequests?: number; windowMs?: number; tracingEnabled?: boolean } = {}) {
        this.enabled = enabled;
        this.maxRequests = maxRequests;
        this.tracingEnabled = tracingEnabled;
        this.urlTimestamps = new Map();
        this.windowMs = windowMs;
    }

    configure({
        maxRequests,
        windowMs,
        tracingEnabled,
    }: { maxRequests?: number; windowMs?: number; tracingEnabled?: boolean } = {}): void {
        this.maxRequests = maxRequests ?? this.maxRequests;
        this.tracingEnabled = tracingEnabled ?? this.tracingEnabled;
        this.windowMs = windowMs ?? this.windowMs;
    }

    enable(): void {
        this.enabled = true;
    }

    disable(): void {
        this.enabled = false;
    }

    isEnabled(): boolean {
        return Boolean(this.enabled);
    }

    recordCall(url: string): number {
        const now = Date.now();
        const timestamps = this.urlTimestamps.get(url) || [];
        timestamps.push(now);
        this.urlTimestamps.set(url, timestamps);
        return now;
    }

    getCallCount(url: string): number {
        const now = Date.now();
        const cutoff = now - this.windowMs;
        const timestamps = this.urlTimestamps.get(url) || [];

        // Filter out timestamps outside the window
        const recentTimestamps = timestamps.filter((timestamp) => timestamp > cutoff);

        // Update the stored timestamps to only include recent ones
        if (recentTimestamps.length !== timestamps.length) {
            if (recentTimestamps.length > 0) {
                this.urlTimestamps.set(url, recentTimestamps);
            } else {
                this.urlTimestamps.delete(url);
            }
        }

        return recentTimestamps.length;
    }

    canMakeCall(url: string): boolean {
        const currentCount = this.getCallCount(url);
        return currentCount < this.maxRequests;
    }

    recordCallOrThrow(url: string): void {
        if (!this.isEnabled()) {
            return;
        }

        if (!this.canMakeCall(url)) {
            const error = new Error(
                `API rate limit exceeded: ${this.getCallCount(url)} requests to ${url} in the last ${this.windowMs}ms (max: ${this.maxRequests})`
            );
            if (this.tracingEnabled) {
                traceError(error);
            }
            throw error;
        }

        this.recordCall(url);
    }

    clear(url: string): void {
        this.urlTimestamps.delete(url);
    }

    clearAll(): void {
        this.urlTimestamps.clear();
    }
}
