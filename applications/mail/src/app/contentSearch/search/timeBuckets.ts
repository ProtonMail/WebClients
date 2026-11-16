export interface TimeBucket {
    low: bigint;
    high: bigint;
}

/**
 * Splits the inclusive range [min, max] into contiguous, non-overlapping
 * inclusive buckets of at most windowSize values, newest first.
 */
export function* generateTimeBuckets(min: bigint, max: bigint, windowSize: bigint): Generator<TimeBucket> {
    if (windowSize <= 0n) {
        throw new Error('windowSize must be positive');
    }

    // `>=` so that a range where min === max still yields one bucket
    for (let high = max; high >= min;) {
        // both bounds are inclusive, so [high - windowSize + 1, high] holds exactly windowSize values
        const windowLow = high - windowSize + 1n;
        const low = windowLow < min ? min : windowLow;
        yield { low, high };
        // the next bucket ends just below this one: bounds are inclusive, so reusing `low`
        // would put entries exactly on the boundary in two buckets and return them twice
        high = low - 1n;
    }
}
