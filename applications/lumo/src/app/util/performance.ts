/**
 * Performance monitoring utilities for development and debugging
 */

interface PerformanceTimer {
    start: number;
    label: string;
}

const activeTimers = new Map<string, PerformanceTimer>();

/**
 * Start timing an operation
 */
export const startTimer = (label: string): void => {
    if (process.env.NODE_ENV === 'development') {
        activeTimers.set(label, {
            start: performance.now(),
            label,
        });
    }
};

/**
 * End timing an operation and log the result
 */
export const endTimer = (label: string): number => {
    if (process.env.NODE_ENV === 'development') {
        const timer = activeTimers.get(label);
        if (timer) {
            const duration = performance.now() - timer.start;
            if (duration > 100) {
                // Only log operations taking more than 100ms
                console.log(`🔥 Performance: ${label} took ${duration.toFixed(2)}ms`);
            }
            activeTimers.delete(label);
            return duration;
        }
    }
    return 0;
};

/**
 * Measure the execution time of a function
 */
export const measureExecution = <T>(label: string, fn: () => T): T => {
    startTimer(label);
    const result = fn();
    endTimer(label);
    return result;
};

/**
 * Measure async function execution time
 */
export const measureAsyncExecution = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    startTimer(label);
    const result = await fn();
    endTimer(label);
    return result;
};
