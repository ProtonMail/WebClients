import type { MutableRefObject } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setJoinedRoom } from '@proton/meet/store/slices/connectionSlice';
import { resetParticipantMaps } from '@proton/meet/store/slices/participants/participantsSlice';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { useStableCallback } from '../useStableCallback';

interface UseMeetingCleanupParams {
    instantMeetingRef: MutableRefObject<boolean>;
    meetingLinkNameRef: MutableRefObject<string>;
    decryptionKeyRef: MutableRefObject<CryptoKey | null>;
    disallowHealthCheck: () => void;
    cleanupMlsState: () => void;
    stopPiP: () => Promise<void>;
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
}: UseMeetingCleanupParams): UseMeetingCleanupResult => {
    const dispatch = useMeetDispatch();
    const room = useRoomContext();
    const meetCoreClient = useMeetCoreClient();

    const cleanupMeeting = useStableCallback(({ disconnect = false }: CleanupMeetingOptions = {}) => {
        instantMeetingRef.current = false;
        meetingLinkNameRef.current = '';

        if (disconnect) {
            void room.disconnect();
            void meetCoreClient.leaveMeeting();
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
