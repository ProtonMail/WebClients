import type { MutableRefObject } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setJoinedRoom } from '@proton/meet/store/slices/connectionSlice';
import { resetParticipantMaps } from '@proton/meet/store/slices/participants/participantsSlice';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { toMeetCoreErrorEnum } from '../../wasm/meetCoreError';
import { MeetCoreRestartedError } from '../../wasm/meetCoreStallRecovery';
import { useStableCallback } from '../useStableCallback';

interface UseMeetingCleanupParams {
    instantMeetingRef: MutableRefObject<boolean>;
    meetingLinkNameRef: MutableRefObject<string>;
    decryptionKeyRef: MutableRefObject<CryptoKey | null>;
    disallowHealthCheck: () => void;
    cleanupMlsState: () => void;
    stopPiP: () => Promise<void>;
    cancelReconnection: () => void;
}

interface CleanupMeetingOptions {
    disconnect?: boolean;
}

export interface UseMeetingCleanupResult {
    cleanupMeeting: (options?: CleanupMeetingOptions) => void;
}

export const useMeetingCleanup = ({
    instantMeetingRef,
    meetingLinkNameRef,
    decryptionKeyRef,
    disallowHealthCheck,
    cleanupMlsState,
    stopPiP,
    cancelReconnection,
}: UseMeetingCleanupParams): UseMeetingCleanupResult => {
    const dispatch = useMeetDispatch();
    const room = useRoomContext();
    const meetCoreClient = useMeetCoreClient();
    const { reportMeetError } = useMeetErrorReporting();

    const cleanupMeeting = useStableCallback(({ disconnect = false }: CleanupMeetingOptions = {}) => {
        cancelReconnection();
        instantMeetingRef.current = false;
        meetingLinkNameRef.current = '';

        if (disconnect) {
            void room.disconnect();
            void meetCoreClient.leaveMeeting().catch((error: unknown) => {
                if (
                    toMeetCoreErrorEnum(error) === MeetCoreErrorEnum.ParticipantNotFound ||
                    error instanceof MeetCoreRestartedError
                ) {
                    return;
                }
                reportMeetError('Failed to leave meeting', { context: { error } });
            });
            void stopPiP();
        }

        dispatch(resetParticipantMaps());
        decryptionKeyRef.current = null;
        disallowHealthCheck();
        cleanupMlsState();
        dispatch(setJoinedRoom(false));
    });

    return { cleanupMeeting };
};
