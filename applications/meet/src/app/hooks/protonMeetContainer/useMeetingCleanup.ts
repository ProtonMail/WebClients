import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { resetParticipantMaps } from '@proton/meet/store/slices/participants/participantsSlice';
import type { MeetingInfoResponse } from '@proton/shared/lib/interfaces/Meet';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { useStableCallback } from '../useStableCallback';

interface UseMeetingCleanupParams {
    instantMeetingRef: MutableRefObject<boolean>;
    meetingLinkNameRef: MutableRefObject<string>;
    meetingInfoRef: MutableRefObject<MeetingInfoResponse | null>;
    decryptionKeyRef: MutableRefObject<CryptoKey | null>;
    disallowHealthCheck: () => void;
    cleanupMlsState: () => void;
    stopPiP: () => Promise<void>;
    setJoinedRoom: Dispatch<SetStateAction<boolean>>;
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
    meetingInfoRef,
    decryptionKeyRef,
    disallowHealthCheck,
    cleanupMlsState,
    stopPiP,
    setJoinedRoom,
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
        meetingInfoRef.current = null;
        decryptionKeyRef.current = null;
        disallowHealthCheck();
        cleanupMlsState();
        setJoinedRoom(false);
    });

    return { cleanupMeeting };
};
