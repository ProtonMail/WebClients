import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useFlag } from '@proton/unleash/useFlag';

import { E2eeStatsDebugger } from '../utils/e2eeRecovery/E2eeStatsDebugger';

/**
 * Mounts a verbose console.table logger of inbound-rtp stats for every
 * subscribed remote receiver, gated by the MeetE2eeDebugStats Unleash flag.
 * Used during incident triage to correlate user-reported
 * audio/video issues with cryptor / transport behaviour without shipping
 * the noise to every session.
 */
export const useE2eeStatsDebugger = () => {
    const room = useRoomContext();
    const isE2eeDebugStatsEnabled = useFlag('MeetE2eeDebugStats');

    useEffect(() => {
        if (!isE2eeDebugStatsEnabled) {
            return;
        }

        const e2eeStatsDebugger = new E2eeStatsDebugger(room);

        e2eeStatsDebugger.setup();

        return () => {
            e2eeStatsDebugger.cleanup();
        };
    }, [room, isE2eeDebugStatsEnabled]);
};
