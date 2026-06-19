import { useEffect, useRef } from 'react';

import { ConnectionState } from 'livekit-client';

import { announcementMessages } from '../messages';
import { AnnouncementPriority } from '../types';
import type { ConnectionAnnouncementState } from '../types';
import { useAnnounce } from '../useAnnounce';

export type ConnectionPhase = 'connected' | 'reconnecting' | 'reconnected' | 'disconnected';

const PHASE_MESSAGES: Partial<Record<ConnectionPhase, () => string>> = {
    reconnecting: announcementMessages.connectionLost,
    reconnected: announcementMessages.reconnected,
    disconnected: announcementMessages.disconnected,
};

export const getConnectionPhase = (state: ConnectionAnnouncementState): ConnectionPhase => {
    if (state.showReconnectedMessage) {
        return 'reconnected';
    }
    if (
        state.isReconnecting ||
        state.mlsRetrying ||
        state.liveKitConnectionState === ConnectionState.Reconnecting ||
        state.liveKitConnectionState === ConnectionState.SignalReconnecting
    ) {
        return 'reconnecting';
    }
    if (state.isDisconnected) {
        return 'disconnected';
    }
    return 'connected';
};

export const useConnectionAnnouncements = (state: ConnectionAnnouncementState) => {
    const announce = useAnnounce();

    const phase = getConnectionPhase(state);
    // null until first run so the initial steady state is not announced.
    const previousPhaseRef = useRef<ConnectionPhase | null>(null);

    useEffect(() => {
        if (previousPhaseRef.current === null) {
            previousPhaseRef.current = phase;
            return;
        }

        if (phase === previousPhaseRef.current) {
            return;
        }
        previousPhaseRef.current = phase;

        const buildMessage = PHASE_MESSAGES[phase];
        if (!buildMessage) {
            return;
        }

        // Key by phase, not a shared 'connection-state', so a fast lost → reconnected
        // transition within the de-dup window does not drop the recovery announcement.
        announce(buildMessage(), { dedupeKey: `connection-${phase}`, priority: AnnouncementPriority.High });
    }, [phase, announce]);
};
