import { useEffect, useState } from 'react';

import { getEpoch } from '../utils/time/epoch';

/** Epoch refreshed on an interval, allowing time-gated UI to re-evaluate on
 * long-lived clients (web & desktop) without waiting for a remount. */
export const useEpoch = (intervalMs: number): number => {
    const [epoch, setEpoch] = useState(getEpoch);

    useEffect(() => {
        const timer = setInterval(() => setEpoch(getEpoch()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);

    return epoch;
};
