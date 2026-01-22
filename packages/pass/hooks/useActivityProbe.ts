import { useEffect, useMemo, useRef } from 'react';

import debounce from 'lodash/debounce';

import type { ActivityProbe } from '@proton/pass/utils/time/probe';
import { createActivityProbe } from '@proton/pass/utils/time/probe';

/** Debounce delay to prevent rapid probe start/stop cycles. */
const PROBE_START_DEBOUNCE_MS = 250;

/** Debounces probe start calls to handle scenarios where effect dependencies
 * may change rapidly (e.g., LockProbeProvider's online state during network
 * instability). This ensures the probe only starts if conditions remain stable
 * for at least PROBE_START_DEBOUNCE_MS. The cancel function is immediate and
 * clears both any pending debounced start calls and active probe intervals. */
export const useActivityProbe = (): ActivityProbe => {
    const probe = useRef(createActivityProbe()).current;
    useEffect(() => () => probe.cancel(), []);

    return useMemo<ActivityProbe>(() => {
        const start = debounce(probe.start, PROBE_START_DEBOUNCE_MS);

        const cancel = () => {
            start.cancel();
            probe.cancel();
        };

        return { start, cancel };
    }, []);
};
