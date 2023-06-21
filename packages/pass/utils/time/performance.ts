import type { Callback } from '@proton/pass/types';

type WithPerformanceOptions = {
    maxTime: number;
    onMaxTime: (ms: number) => void;
};

export const withMaxExecutionTime = <F extends Callback>(fn: F, options: WithPerformanceOptions): F =>
    ((...args) => {
        const start = performance.now();
        const result = fn(...args);
        const end = performance.now();

        const ms = end - start;
        if (ms >= options.maxTime) options.onMaxTime(ms);

        return result;
    }) as F;
