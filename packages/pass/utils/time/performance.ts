import type { Callback } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

type WithPerformanceOptions = {
    id: string;
    maxTime: number;
    onMaxTime: (ms: number) => void;
};

export const withMaxExecutionTime = <F extends Callback>(fn: F, options: WithPerformanceOptions): F =>
    ((...args) => {
        const start = performance.now();
        const result = fn(...args);
        const end = performance.now();

        const ms = end - start;
        logger.debug(`[Performance::${options.id}] ${ms.toFixed(2)}ms`);
        if (ms >= options.maxTime) options.onMaxTime(ms);

        return result;
    }) as F;
