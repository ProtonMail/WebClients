import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useIsWaitingRoomJoinEnabled } from '@proton/meet/hooks/useWaitingRoomFlags';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { setJoiningInProgress } from '@proton/meet/store/slices/connectionSlice';
import {
    WaitingRoomAdmissionStatus,
    selectAdmissionStatus,
    selectIsWaitingRoomHost,
} from '@proton/meet/store/slices/waitingRoomSlice';

import type { WaitingRoomContextValues } from '../../../contexts/WaitingRoomContext';
import { useNotifyError } from '../../useNotifyError';
import type { GetSessionKeyBase64 } from '../useSessionKey';
import { useHostWaitingRoom } from './useHostWaitingRoom';
import { usePreJoinWaitingRoom } from './usePreJoinWaitingRoom';

interface UseWaitingRoomParams {
    meetingLinkName: string;
    getSessionKeyBase64: GetSessionKeyBase64;
    prepareGuestSession: (meetingToken: string) => Promise<boolean>;
    refreshGuestSession: (meetingToken: string) => Promise<boolean>;
    joinAfterAdmission: (meetingToken: string) => Promise<void>;
    cleanupJoin: () => void;
}

type UseWaitingRoomResult = {
    providerProps: WaitingRoomContextValues;
    beginJoin: (
        meetingToken: string,
        meetingDetails: { canManageWaitingRoom: boolean; waitingRoom: boolean }
    ) => Promise<{ handled: boolean; isWaitingRoomHostJoin: boolean }>;
};

export const useWaitingRoom = ({
    meetingLinkName,
    getSessionKeyBase64,
    prepareGuestSession,
    refreshGuestSession,
    joinAfterAdmission,
    cleanupJoin,
}: UseWaitingRoomParams): UseWaitingRoomResult => {
    const isWaitingRoomJoinEnabled = useIsWaitingRoomJoinEnabled();

    const dispatch = useMeetDispatch();
    const notifyError = useNotifyError();
    const { reportMeetError } = useMeetErrorReporting();

    const isWaitingRoomHost = useMeetSelector(selectIsWaitingRoomHost);
    const admissionStatus = useMeetSelector(selectAdmissionStatus);

    const waitingRoomMeetLinkRef = useRef<string | null>(null);
    const guestSessionPreparedRef = useRef(false);

    const { admitRequest, rejectRequest, admitAll, toggleWaitingRoom, toggleWaitingRoomPrejoin } = useHostWaitingRoom({
        meetingLinkName,
        enabled: isWaitingRoomHost && isWaitingRoomJoinEnabled,
        getSessionKeyBase64,
    });

    const {
        startAdmission: startWaitingRoomAdmission,
        leave,
        clearRejection,
        reset: resetAdmission,
    } = usePreJoinWaitingRoom();

    useEffect(() => {
        if (admissionStatus !== WaitingRoomAdmissionStatus.ADMITTED) {
            return;
        }

        const meetLink = waitingRoomMeetLinkRef.current;
        if (!meetLink) {
            return;
        }

        resetAdmission();
        void joinAfterAdmission(meetLink);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [admissionStatus]);

    const handleGuestWaitingRoomLeave = useCallback(async () => {
        dispatch(setJoiningInProgress(false));
        await leave(waitingRoomMeetLinkRef.current ?? undefined);
        cleanupJoin();
    }, [dispatch, leave, cleanupJoin]);

    const requestAdmission = useCallback(
        async (meetingToken: string) => {
            const prepared = guestSessionPreparedRef.current
                ? await refreshGuestSession(meetingToken)
                : await prepareGuestSession(meetingToken);

            if (!prepared) {
                return;
            }

            guestSessionPreparedRef.current = true;

            const sessionKey = await getSessionKeyBase64(meetingToken);
            if (!sessionKey) {
                notifyError(c('Error').t`Failed to join meeting. Please try again.`);
                reportMeetError('Missing session key for waiting room admission', {});
                return;
            }

            await startWaitingRoomAdmission(meetingToken, sessionKey);
        },
        [
            prepareGuestSession,
            refreshGuestSession,
            getSessionKeyBase64,
            startWaitingRoomAdmission,
            notifyError,
            reportMeetError,
        ]
    );

    const handleGuestTryAgain = useCallback(async () => {
        await clearRejection();
    }, [clearRejection]);

    const leaveWaitingRoom = useCallback(() => {
        void handleGuestWaitingRoomLeave();
    }, [handleGuestWaitingRoomLeave]);

    const retryWaitingRoom = useCallback(() => {
        void handleGuestTryAgain();
    }, [handleGuestTryAgain]);

    /**
     * Resolves how this join proceeds. For a guest it starts the admission flow and returns
     * `handled: true` (the caller must not join yet). Otherwise returns `handled: false` with the host flag.
     */
    const beginJoin = async (
        meetingToken: string,
        { canManageWaitingRoom, waitingRoom }: { canManageWaitingRoom: boolean; waitingRoom: boolean }
    ) => {
        if (!isWaitingRoomJoinEnabled) {
            return { handled: false, isWaitingRoomHostJoin: false };
        }

        if (waitingRoom && !canManageWaitingRoom) {
            // The join itself runs later, in the `admitted` status effect.
            waitingRoomMeetLinkRef.current = meetingToken;
            await requestAdmission(meetingToken);
            return { handled: true, isWaitingRoomHostJoin: false };
        }

        return { handled: false, isWaitingRoomHostJoin: waitingRoom && canManageWaitingRoom };
    };

    return {
        providerProps: {
            isWaitingRoomHost,
            admitRequest,
            rejectRequest,
            admitAll,
            toggleWaitingRoom,
            toggleWaitingRoomPrejoin,
            leaveWaitingRoom,
            retryWaitingRoom,
        },
        beginJoin,
    };
};
