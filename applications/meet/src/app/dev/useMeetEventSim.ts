import { useEffect } from 'react';

import { useMeetDispatch } from '@proton/meet/store/hooks';

import { initMeetEventSim } from './meetEventSim';

/**
 * React bridge for `meetEventSim`. Passes Redux dispatch to the tool
 * and tears it down when the component unmounts.
 *
 * No-op in production builds — the effect body is statically eliminated by the bundler.
 */
export const useMeetEventSim = () => {
    const dispatch = useMeetDispatch();

    useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            return;
        }

        return initMeetEventSim(dispatch);
    }, [dispatch]);
};
