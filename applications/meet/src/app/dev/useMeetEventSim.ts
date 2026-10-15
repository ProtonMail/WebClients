import { useEffect } from 'react';

import { useMeetDispatch, useMeetStore } from '@proton/meet/store/hooks';

import { useChatMessage } from '../hooks/bridges/useChatMessage';
import { useStableCallback } from '../hooks/useStableCallback';
import { initMeetEventSim } from './meetEventSim';

/**
 * React bridge for `meetEventSim`. Passes Redux dispatch and the store's
 * `getState` to the tool and tears it down when the component unmounts.
 *
 * No-op in production builds — the effect body is statically eliminated by the bundler.
 */
export const useMeetEventSim = () => {
    const dispatch = useMeetDispatch();
    const store = useMeetStore();

    const { sendMessage: latestSendMessage } = useChatMessage();
    // Stable, so a re-render can't tear down the tool and cancel a running simulation.
    const sendMessage = useStableCallback(latestSendMessage);

    useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            return;
        }

        return initMeetEventSim(dispatch, sendMessage, store.getState);
    }, [dispatch, sendMessage, store]);
};
