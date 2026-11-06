import { useEffect, useRef } from 'react';

import { ConnectionState } from 'livekit-client';

import { AnnouncementPriority } from '@proton/components/components/liveAnnouncer/types';
import { useAnnounce } from '@proton/components/components/liveAnnouncer/useAnnounce';

import { announcementMessages } from '../messages';
import type { ConnectionAnnouncementState } from '../types';

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
    if (state.isWebsocketReconnecting) {
        return 'reconnecting';
    }
    return 'connected';
};

export const useConnectionAnnouncements = (state: ConnectionAnnouncementState) => {
    const announce = useAnnounce();

    const phase = getConnectionPhase(state);
    const isServerReconnecting = phase === 'reconnecting' && state.isWebsocketReconnecting;
    // null until first run so the initial steady state is not announced.
    const previousPhaseRef = useRef<ConnectionPhase | null>(null);
    const wasServerReconnectingRef = useRef(false);

    useEffect(() => {
        const previousPhase = previousPhaseRef.current;
        const wasServerReconnecting = wasServerReconnectingRef.current;
        previousPhaseRef.current = phase;
        wasServerReconnectingRef.current = isServerReconnecting;

        if (previousPhase === null || phase === previousPhase) {
            return;
        }
        // LiveKit announces its own recovery through showReconnectedMessage, and its state can be
        // cleared (banner closed) while it is still down, so only the meeting server's recovery is inferred.
        const announcedPhase = wasServerReconnecting && phase === 'connected' ? 'reconnected' : phase;

        const buildMessage = PHASE_MESSAGES[announcedPhase];
        if (!buildMessage) {
            return;
        }

        // Key by phase, not a shared 'connection-state', so a fast lost → reconnected
        // transition within the de-dup window does not drop the recovery announcement.
        announce(buildMessage(), { dedupeKey: `connection-${announcedPhase}`, priority: AnnouncementPriority.High });
    }, [phase, isServerReconnecting, announce]);
};
