import { useEffect, useRef } from 'react';

import { AnnouncementPriority } from '@proton/components/components/liveAnnouncer/types';
import { useAnnounce } from '@proton/components/components/liveAnnouncer/useAnnounce';

import type { ConnectionStatus } from '../../../hooks/useConnectionStatus/useConnectionStatus';
import { announcementMessages } from '../messages';

type ConnectionPhase = ConnectionStatus['phase'];

const PHASE_MESSAGES: Partial<Record<ConnectionPhase, () => string>> = {
    reconnecting: announcementMessages.connectionLost,
    reconnected: announcementMessages.reconnected,
    disconnected: announcementMessages.disconnected,
};

export const useConnectionAnnouncements = (phase: ConnectionPhase) => {
    const announce = useAnnounce();

    // null until first run so the initial steady state is not announced.
    const previousPhaseRef = useRef<ConnectionPhase | null>(null);
    const transitionCountRef = useRef(0);

    useEffect(() => {
        const previousPhase = previousPhaseRef.current;
        previousPhaseRef.current = phase;

        if (previousPhase === null || phase === previousPhase) {
            return;
        }

        const buildMessage = PHASE_MESSAGES[phase];
        if (!buildMessage) {
            return;
        }

        // A key per transition: the announcer drops a key reused within 3 s, and a connection can
        // drop and recover more than once in that window.
        transitionCountRef.current += 1;
        announce(buildMessage(), {
            dedupeKey: `connection-transition-${transitionCountRef.current}`,
            priority: AnnouncementPriority.High,
        });
    }, [phase, announce]);
};
