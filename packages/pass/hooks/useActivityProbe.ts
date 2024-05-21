import { useEffect, useRef } from 'react';

import { logger } from '../utils/logger';

export type ActivityProbe = ReturnType<typeof createActivityProbe>;

export const createActivityProbe = () => {
    const state: { interval?: NodeJS.Timeout } = {};

    const cancel = () => {
        logger.debug(`[ActivityProbe] Cancelling probe..`);
        clearInterval(state?.interval);
    };

    const start = (onProbe: () => void, timeout: number) => {
        logger.debug(`[ActivityProbe] probe set to ${timeout}ms`);

        clearInterval(state?.interval);
        state.interval = setInterval(onProbe, timeout);
        void onProbe();
    };

    return { start, cancel };
};

export const useActivityProbe = (): ActivityProbe => {
    const probe = useRef(createActivityProbe()).current;
    useEffect(() => () => probe.cancel(), []);
    return probe;
};
