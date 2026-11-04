import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetDispatch, useMeetStore } from '@proton/meet/store/hooks';

import { useMeetCoreClient } from '../contexts/MeetCoreClientContext';
import { useChatMessage } from '../hooks/bridges/useChatMessage';
import { useStableCallback } from '../hooks/useStableCallback';
import { initMeetEventSim } from './meetEventSim';

/**
 * No-op in production builds — the effect body is statically eliminated by the bundler.
 */
export const useMeetEventSim = () => {
    const dispatch = useMeetDispatch();
    const store = useMeetStore();
    const room = useRoomContext();
    const meetCoreClient = useMeetCoreClient();

    const { sendMessage: latestSendMessage } = useChatMessage();
    // Stable, so a re-render can't tear down the tool and cancel a running simulation.
    const sendMessage = useStableCallback(latestSendMessage);

    useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            return;
        }

        return initMeetEventSim({ dispatch, sendMessage, getState: store.getState, room, meetCoreClient });
    }, [dispatch, sendMessage, store, room, meetCoreClient]);
};
