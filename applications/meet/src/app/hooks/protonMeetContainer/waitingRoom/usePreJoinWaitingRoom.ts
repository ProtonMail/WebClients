import { useCallback, useEffect, useRef } from 'react';

import { MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';
import { c } from 'ttag';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useIsWaitingRoomJoinEnabled } from '@proton/meet/hooks/useWaitingRoomFlags';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    WaitingRoomAdmissionStatus,
    cancelAdmission,
    selectAdmissionStatus,
    setAdmissionStatus,
    settleAdmission,
    startWaitingRoomAdmissionTimer,
} from '@proton/meet/store/slices/waitingRoomSlice';
import { SECOND } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useMeetCoreClient } from '../../../contexts/MeetCoreClientContext';
import {
    clearWaitingRoomJoinDecisionCallback,
    setWaitingRoomJoinDecisionCallback,
} from '../../../wasm/waitingRoomCallbacks';
import { useNotifyError } from '../../useNotifyError';

const HOST_POLL_INTERVAL_MS = 3 * SECOND;

type AdmissionRequest = {
    meetLinkName: string;
    meetingSessionKeyBase64: string;
};

/** Guest-only pre-join admission state machine. Hosts must not call startAdmission. */
export const usePreJoinWaitingRoom = () => {
    const isWaitingRoomJoinEnabled = useIsWaitingRoomJoinEnabled();

    const dispatch = useMeetDispatch();
    const meetCoreClient = useMeetCoreClient();
    const notifyError = useNotifyError();
    const admissionStatus = useMeetSelector(selectAdmissionStatus);

    const { reportMeetError } = useMeetErrorReporting();

    const admissionRequestRef = useRef<AdmissionRequest | null>(null);

    useEffect(() => {
        if (!isWaitingRoomJoinEnabled) {
            return;
        }

        setWaitingRoomJoinDecisionCallback((_requestId, admitted) => {
            if (!admitted) {
                dispatch(settleAdmission(WaitingRoomAdmissionStatus.REJECTED));
            }
        });

        return () => {
            clearWaitingRoomJoinDecisionCallback();

            const meetLinkName = admissionRequestRef.current?.meetLinkName;

            if (!meetLinkName) {
                return;
            }

            admissionRequestRef.current = null;

            void meetCoreClient.cancelWaitingRoomJoinRequest(meetLinkName).catch(noop);
            void meetCoreClient.clearJoinDecisionHandler().catch(noop);
        };
    }, [dispatch, isWaitingRoomJoinEnabled, meetCoreClient]);

    const awaitWelcome = useCallback(
        async (meetLinkName: string) => {
            try {
                await meetCoreClient.waitForWaitingRoomWelcome(meetLinkName);
                dispatch(settleAdmission(WaitingRoomAdmissionStatus.ADMITTED));
            } catch (error) {
                if (error === MeetCoreErrorEnum.WaitingRoomJoinCancelled) {
                    return;
                }

                // Don't report when join request times out
                if (error !== MeetCoreErrorEnum.RoomJoinRequestTimeout) {
                    reportMeetError('Failed to wait for waiting room welcome', {
                        context: { error },
                    });
                }

                dispatch(settleAdmission(WaitingRoomAdmissionStatus.EXPIRED));
            }
        },
        [meetCoreClient, dispatch, reportMeetError]
    );

    const sendJoinRequest = useCallback(async () => {
        const admissionRequest = admissionRequestRef.current;

        if (!admissionRequest) {
            return;
        }

        const { meetLinkName, meetingSessionKeyBase64 } = admissionRequest;

        try {
            await meetCoreClient.createJoinRequest(meetLinkName, meetingSessionKeyBase64);
        } catch (error) {
            notifyError(c('Error').t`Failed to join meeting. Please try again.`);
            reportMeetError('Failed to create waiting room join request prejoin', {
                context: { error },
            });
            dispatch(cancelAdmission());
            return;
        }

        if (admissionRequestRef.current !== admissionRequest) {
            return;
        }

        dispatch(setAdmissionStatus(WaitingRoomAdmissionStatus.AWAITING));
        dispatch(startWaitingRoomAdmissionTimer());
        void awaitWelcome(meetLinkName);
    }, [meetCoreClient, dispatch, notifyError, reportMeetError, awaitWelcome]);

    useEffect(() => {
        if (admissionStatus !== WaitingRoomAdmissionStatus.HOST_NOT_STARTED) {
            return;
        }

        let cancelled = false;
        let checking = false;

        const interval = setInterval(async () => {
            if (checking) {
                return;
            }

            checking = true;
            const hasGroup = await meetCoreClient.hasMlsGroupInfo().catch(() => false);
            checking = false;

            if (cancelled || !hasGroup) {
                return;
            }

            clearInterval(interval);
            void sendJoinRequest();
        }, HOST_POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [admissionStatus, meetCoreClient, sendJoinRequest]);

    const startAdmission = useCallback(
        async (meetLinkName: string, meetingSessionKeyBase64: string) => {
            const admissionRequest = { meetLinkName, meetingSessionKeyBase64 };

            admissionRequestRef.current = admissionRequest;

            try {
                await meetCoreClient.setJoinDecisionHandler();
            } catch (error) {
                reportMeetError('Failed to set waiting room join decision handler', {
                    context: { error },
                });
            }

            let hasGroup = false;
            try {
                hasGroup = await meetCoreClient.hasMlsGroupInfo();
            } catch {
                // Assume the host hasn't created the group yet and wait for it below.
            }

            if (admissionRequestRef.current !== admissionRequest) {
                return;
            }

            if (!hasGroup) {
                // The polling effect takes over and sends the request once the host starts.
                dispatch(setAdmissionStatus(WaitingRoomAdmissionStatus.HOST_NOT_STARTED));
                return;
            }

            await sendJoinRequest();
        },
        [meetCoreClient, dispatch, reportMeetError, sendJoinRequest]
    );

    // User bailed out: cancel the pending request server-side and reset. Aborts any in-flight admission.
    const leave = useCallback(
        async (meetLinkName?: string) => {
            const linkToCancel = meetLinkName ?? admissionRequestRef.current?.meetLinkName;

            admissionRequestRef.current = null;
            dispatch(cancelAdmission());

            if (linkToCancel) {
                try {
                    await meetCoreClient.cancelWaitingRoomJoinRequest(linkToCancel);
                } catch (error) {
                    reportMeetError('Failed to cancel waiting room join request', {
                        context: { error },
                    });
                }
            }
            try {
                await meetCoreClient.clearJoinDecisionHandler();
            } catch (error) {
                reportMeetError('Failed to clear waiting room join decision handler', { context: { error } });
            }
        },
        [meetCoreClient, dispatch, reportMeetError]
    );

    // After a rejection: clear the local WASM state so the guest can request again.
    const clearRejection = useCallback(async () => {
        admissionRequestRef.current = null;
        dispatch(cancelAdmission());

        try {
            await meetCoreClient.clearWaitingRoomJoinRequest();
        } catch (error) {
            reportMeetError('Failed to clear waiting room join request', { context: { error } });
        }
        try {
            await meetCoreClient.clearJoinDecisionHandler();
        } catch (error) {
            reportMeetError('Failed to clear waiting room join decision handler', { context: { error } });
        }
    }, [meetCoreClient, dispatch, reportMeetError]);

    // Local reset to `inactive` (e.g. once admitted and proceeding to join). Does not touch the server.
    const reset = useCallback(() => {
        admissionRequestRef.current = null;
        dispatch(cancelAdmission());
    }, [dispatch]);

    return isWaitingRoomJoinEnabled
        ? {
              startAdmission,
              leave,
              clearRejection,
              reset,
          }
        : {
              startAdmission: () => Promise.resolve(),
              leave: () => Promise.resolve(),
              clearRejection: () => Promise.resolve(),
              reset: () => {},
          };
};
