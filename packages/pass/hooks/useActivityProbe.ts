import { useEffect, useRef } from 'react';

export type ActivityProbe = ReturnType<typeof createActivityProbe>;

const ACTIVITY_PROBE_TIMEOUT = 5_000;

export const createActivityProbe = (onProbe: () => void, timeout: number = ACTIVITY_PROBE_TIMEOUT) => {
    const timer: { interval?: ReturnType<typeof setInterval> } = {};

    const cancel = () => clearInterval(timer?.interval);

    const start = () => {
        cancel();
        timer.interval = setInterval(onProbe, timeout);
        void onProbe();
    };

    return { start, cancel };
};

export const useActivityProbe = (onProbe: () => void): ActivityProbe => {
    const probe = useRef(createActivityProbe(onProbe)).current;
    useEffect(() => () => probe.cancel(), []);
    return probe;
};
