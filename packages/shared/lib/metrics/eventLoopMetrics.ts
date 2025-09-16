import metrics from '@proton/metrics/index';

export type EventLoopType = 'core' | 'mail' | 'calendar' | 'contact';

export interface EventLoopV5TimingData {
    processingTimeMs: number;
    hasMore: boolean;
    intervalSinceLastMs: number;
}

export interface EventLoopV6TimingData extends EventLoopV5TimingData {
    apiCallsCount: number;
    apiFailuresCount: number;
    loopType: EventLoopType;
}

const getHasMoreBucket = (hasMore: boolean): 'true' | 'false' => {
    return hasMore ? 'true' : 'false';
};

const getIntervalBucket = (ms: number): '<1000' | '1000-5000' | '5000-10000' | '10000-30000' | '30000+' => {
    if (ms < 1000) {
        return '<1000';
    }
    if (ms < 5000) {
        return '1000-5000';
    }
    if (ms < 10000) {
        return '5000-10000';
    }
    if (ms <= 30000) {
        return '10000-30000';
    }
    return '30000+';
};

const getApiCallsBucket = (count: number): '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10+' => {
    if (count >= 10) {
        return '10+';
    }
    return String(count) as '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
};

const getApiFailuresBucket = (count: number): '0' | '1' | '2' | '3' | '4' | '5+' => {
    if (count >= 5) {
        return '5+';
    }
    return String(count) as '0' | '1' | '2' | '3' | '4';
};

/**
 * Utility class to track event loop processing timing
 */
class EventLoopTimingTracker {
    private v5ProcessingTime?: number;
    private v6ProcessingTime?: number;
    private v5LastRequestTime?: number;
    private v6LastRequestTime?: { [loopType: string]: number };

    // For testing: allow injecting a time function
    // Using Date.now() instead of performance.now() for cross-environment compatibility and testability
    private timeProvider: () => number = () => Date.now();

    private getNow(): number {
        return this.timeProvider();
    }

    /**
     * Set time provider for testing
     * @internal
     */
    setTimeProvider(provider: () => number): void {
        this.timeProvider = provider;
    }

    startV5Processing(): void {
        this.v5ProcessingTime = this.getNow();
    }

    endV5Processing(hasMore: boolean = false): void {
        if (this.v5ProcessingTime === undefined) {
            return;
        }

        const now = this.getNow();
        const processingTimeMs = Math.round(now - this.v5ProcessingTime);

        // Calculate interval since last request (time between event loop starts)
        let intervalSinceLastMs = 0;

        if (this.v5LastRequestTime !== undefined) {
            intervalSinceLastMs = Math.round(this.v5ProcessingTime - this.v5LastRequestTime);
        }

        this.v5LastRequestTime = now;
        this.v5ProcessingTime = undefined;

        this.sendEventLoopV5Metrics({
            processingTimeMs,
            hasMore,
            intervalSinceLastMs,
        });
    }

    startV6Processing(loopType?: EventLoopType): void {
        this.v6ProcessingTime = this.getNow();

        if (loopType) {
            if (!this.v6LastRequestTime) {
                this.v6LastRequestTime = {};
            }
        }
    }

    endV6Processing(
        hasMore: boolean = false,
        apiCallsCount: number = 0,
        loopType: EventLoopType,
        apiFailuresCount: number = 0
    ): void {
        if (this.v6ProcessingTime === undefined) {
            return;
        }

        const now = this.getNow();
        const processingTimeMs = Math.round(now - this.v6ProcessingTime);

        // Calculate interval since last request for this loop type (time between event loop starts)
        let intervalSinceLastMs = 0;

        if (this.v6LastRequestTime && this.v6LastRequestTime[loopType] !== undefined) {
            intervalSinceLastMs = Math.round(this.v6ProcessingTime - this.v6LastRequestTime[loopType]);
        }

        if (!this.v6LastRequestTime) {
            this.v6LastRequestTime = {};
        }

        this.v6LastRequestTime[loopType] = now;
        this.v6ProcessingTime = undefined;

        this.sendEventLoopV6Metrics({
            processingTimeMs,
            hasMore,
            apiCallsCount,
            apiFailuresCount,
            loopType,
            intervalSinceLastMs,
        });
    }

    private sendEventLoopV6Metrics(data: EventLoopV6TimingData): void {
        const processingTimeSeconds = data.processingTimeMs / 1000;

        const labels = {
            has_more: getHasMoreBucket(data.hasMore),
            event_loop_type: data.loopType,
            api_calls_count: getApiCallsBucket(data.apiCallsCount),
            api_failures_count: getApiFailuresBucket(data.apiFailuresCount),
            interval_since_last_ms: getIntervalBucket(data.intervalSinceLastMs),
        };

        metrics.core_event_loop_six_processing_time_histogram.observe({
            Value: processingTimeSeconds,
            Labels: labels,
        });
    }

    private sendEventLoopV5Metrics(data: EventLoopV5TimingData): void {
        const processingTimeSeconds = data.processingTimeMs / 1000;

        const labels = {
            has_more: getHasMoreBucket(data.hasMore),
            interval_since_last_ms: getIntervalBucket(data.intervalSinceLastMs),
        };

        metrics.core_event_loop_five_processing_time_histogram.observe({
            Value: processingTimeSeconds,
            Labels: labels,
        });
    }

    reset(): void {
        this.v5ProcessingTime = undefined;
        this.v6ProcessingTime = undefined;
        this.v5LastRequestTime = undefined;
        this.v6LastRequestTime = undefined;
    }
}

export const eventLoopTimingTracker = new EventLoopTimingTracker();
