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
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';

import type { WaitingRoomContextValues } from '../../../contexts/WaitingRoomContext';
import { useNotifyError } from '../../useNotifyError';
import type { GetSessionKeyBase64 } from '../useSessionKey';
import { useHostWaitingRoom } from './useHostWaitingRoom';
import { usePreJoinWaitingRoom } from './usePreJoinWaitingRoom';

interface UseWaitingRoomParams {
    meetingLinkName: string;
    getSessionKeyBase64: GetSessionKeyBase64;
    prepareGuestSession: (meetingLinkName: string) => Promise<boolean>;
    refreshGuestSession: (meetingLinkName: string) => Promise<boolean>;
    joinAfterAdmission: (meetingLinkName: string) => Promise<void>;
    cleanupJoin: () => void;
}

type UseWaitingRoomResult = {
    providerProps: WaitingRoomContextValues;
    beginJoin: (
        meetingLinkName: string,
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

    const waitingRoomMeetingLinkNameRef = useRef<string | null>(null);
    const guestSessionPreparedRef = useRef(false);
    const admissionRequestCountRef = useRef(0);

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

        const waitingRoomMeetingLinkName = waitingRoomMeetingLinkNameRef.current;
        if (!waitingRoomMeetingLinkName) {
            return;
        }

        resetAdmission();
        void joinAfterAdmission(waitingRoomMeetingLinkName);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [admissionStatus]);

    const handleGuestWaitingRoomLeave = useCallback(async () => {
        dispatch(setJoiningInProgress(false));
        await leave(waitingRoomMeetingLinkNameRef.current ?? undefined);
        cleanupJoin();
    }, [dispatch, leave, cleanupJoin]);

    const requestAdmission = useCallback(
        async (meetingLinkName: string) => {
            const prepared = guestSessionPreparedRef.current
                ? await refreshGuestSession(meetingLinkName)
                : await prepareGuestSession(meetingLinkName);

            if (!prepared) {
                return;
            }

            guestSessionPreparedRef.current = true;

            const sessionKey = await getSessionKeyBase64(meetingLinkName);
            if (!sessionKey) {
                notifyError(c('Error').t`Failed to join meeting. Please try again.`);
                reportMeetError('Missing session key for waiting room admission', {});
                return;
            }

            admissionRequestCountRef.current += 1;
            await startWaitingRoomAdmission(meetingLinkName, sessionKey);
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
        sendMeetActionsEvent(
            TelemetryMeetActionsEvents.waiting_room_retry_clicked,
            { reason: admissionStatus === WaitingRoomAdmissionStatus.EXPIRED ? 'expired' : 'rejected' },
            { attemptNumber: admissionRequestCountRef.current + 1 }
        );
        void handleGuestTryAgain();
    }, [handleGuestTryAgain, admissionStatus]);

    /**
     * Resolves how this join proceeds. For a guest it starts the admission flow and returns
     * `handled: true` (the caller must not join yet). Otherwise returns `handled: false` with the host flag.
     */
    const beginJoin = async (
        meetingLinkName: string,
        { canManageWaitingRoom, waitingRoom }: { canManageWaitingRoom: boolean; waitingRoom: boolean }
    ) => {
        if (!isWaitingRoomJoinEnabled) {
            return { handled: false, isWaitingRoomHostJoin: false };
        }

        if (waitingRoom && !canManageWaitingRoom) {
            // The join itself runs later, in the `admitted` status effect.
            waitingRoomMeetingLinkNameRef.current = meetingLinkName;
            await requestAdmission(meetingLinkName);
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
