import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import {
    WaitingRoomAdmissionStatus,
    setAdmissionStatus,
    startWaitingRoomAdmissionTimer,
    stopWaitingRoomAdmissionTimer,
} from '@proton/meet/store/slices/waitingRoomSlice';
import { SECOND } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import type { MeetCoreClient } from '../../../wasm/MeetCoreClient';
import {
    clearWaitingRoomJoinDecisionCallback,
    setWaitingRoomJoinDecisionCallback,
} from '../../../wasm/waitingRoomCallbacks';
import { useNotifyError } from '../../useNotifyError';

const HOST_POLL_INTERVAL_MS = 3 * SECOND;

// Guest-only pre-join admission state machine. Hosts must not call startAdmission.
export const usePreJoinWaitingRoom = ({ meetCoreClient }: { meetCoreClient: MeetCoreClient | null }) => {
    const isMeetWaitingRoomEnabled = useFlag('MeetWaitingRoom');

    const dispatch = useMeetDispatch();
    const notifyError = useNotifyError();

    const { reportMeetError } = useMeetErrorReporting();

    // Bumped on every start/leave/reset; a detached flow only dispatches while its generation is current,
    // so rapid join/leave can't let a stale flow flip the status.
    const generationRef = useRef(0);
    const awaitingDecisionRef = useRef(false);
    const pendingMeetLinkRef = useRef<string | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPoll = useCallback(() => {
        if (pollIntervalRef.current !== null) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!isMeetWaitingRoomEnabled) {
            return;
        }

        setWaitingRoomJoinDecisionCallback((_requestId, admitted) => {
            if (!admitted && awaitingDecisionRef.current) {
                awaitingDecisionRef.current = false;
                dispatch(setAdmissionStatus(WaitingRoomAdmissionStatus.REJECTED));
            }
        });
        return () => {
            clearWaitingRoomJoinDecisionCallback();
        };
    }, [dispatch, isMeetWaitingRoomEnabled]);

    useEffect(() => {
        if (!isMeetWaitingRoomEnabled) {
            return;
        }

        return () => {
            stopPoll();
            dispatch(stopWaitingRoomAdmissionTimer());
        };
    }, [stopPoll, dispatch, isMeetWaitingRoomEnabled]);

    const startAdmission = useCallback(
        async (meetLinkName: string, meetingSessionKeyBase64: string) => {
            if (!meetCoreClient) {
                return;
            }

            const generation = (generationRef.current += 1);
            const isStale = () => generationRef.current !== generation;

            const awaitWelcome = async () => {
                try {
                    await meetCoreClient.waitForWaitingRoomWelcome(meetLinkName);
                    if (!isStale()) {
                        awaitingDecisionRef.current = false;
                        dispatch(setAdmissionStatus(WaitingRoomAdmissionStatus.ADMITTED));
                    }
                } catch {
                    if (!isStale()) {
                        awaitingDecisionRef.current = false;
                        dispatch(setAdmissionStatus(WaitingRoomAdmissionStatus.EXPIRED));
                    }
                } finally {
                    if (!isStale()) {
                        dispatch(stopWaitingRoomAdmissionTimer());
                    }
                }
            };

            const sendJoinRequest = async () => {
                try {
                    await meetCoreClient.createJoinRequest(meetLinkName, meetingSessionKeyBase64);
                    pendingMeetLinkRef.current = meetLinkName;
                } catch (error: any) {
                    if (!isStale()) {
                        notifyError(c('Error').t`Failed to join meeting. Please try again.`);
                        reportMeetError('Failed to create waiting room join request prejoin', {
                            context: { error },
                            tags: { meetingLinkName: meetLinkName },
                        });
                        dispatch(setAdmissionStatus(WaitingRoomAdmissionStatus.INACTIVE));
                    }
                    return;
                }

                if (isStale()) {
                    return;
                }

                awaitingDecisionRef.current = true;
                dispatch(setAdmissionStatus(WaitingRoomAdmissionStatus.AWAITING));
                dispatch(startWaitingRoomAdmissionTimer());
                void awaitWelcome();
            };

            const pollForHostThenSend = async () => {
                await new Promise<void>((resolve) => {
                    const interval = setInterval(async () => {
                        if (isStale()) {
                            clearInterval(interval);
                            resolve();
                            return;
                        }
                        try {
                            if (await meetCoreClient.hasMlsGroupInfo()) {
                                clearInterval(interval);
                                resolve();
                            }
                        } catch {}
                    }, HOST_POLL_INTERVAL_MS);
                    pollIntervalRef.current = interval;
                });

                if (!isStale()) {
                    await sendJoinRequest();
                }
            };

            try {
                await meetCoreClient.setJoinDecisionHandler();
            } catch (error) {
                reportMeetError('Failed to set waiting room join decision handler', {
                    context: { error },
                    tags: { meetingLinkName: meetLinkName },
                });
            }

            let hasGroup = false;
            try {
                hasGroup = await meetCoreClient.hasMlsGroupInfo();
            } catch {
                // Assume the host hasn't created the group yet and wait for it below.
            }

            if (isStale()) {
                return;
            }

            if (!hasGroup) {
                dispatch(setAdmissionStatus(WaitingRoomAdmissionStatus.HOST_NOT_STARTED));
                void pollForHostThenSend();
                return;
            }

            await sendJoinRequest();
        },
        [meetCoreClient, dispatch, notifyError, reportMeetError]
    );

    // User bailed out: cancel the pending request server-side and reset. Aborts any in-flight admission.
    const leave = useCallback(
        async (meetLinkName?: string) => {
            generationRef.current += 1;
            awaitingDecisionRef.current = false;
            stopPoll();
            dispatch(stopWaitingRoomAdmissionTimer());

            const linkToCancel = meetLinkName ?? pendingMeetLinkRef.current;
            if (linkToCancel) {
                try {
                    await meetCoreClient?.cancelWaitingRoomJoinRequest(linkToCancel);
                } catch (error) {
                    reportMeetError('Failed to cancel waiting room join request', {
                        context: { error },
                        tags: { meetingLinkName: linkToCancel },
                    });
                }
                pendingMeetLinkRef.current = null;
            }
            try {
                await meetCoreClient?.clearJoinDecisionHandler();
            } catch (error) {
                reportMeetError('Failed to clear waiting room join decision handler', { context: { error } });
            }

            dispatch(setAdmissionStatus(WaitingRoomAdmissionStatus.INACTIVE));
        },
        [meetCoreClient, stopPoll, dispatch, reportMeetError]
    );

    // After a rejection: clear the local WASM state so the guest can request again.
    const clearRejection = useCallback(async () => {
        generationRef.current += 1;
        awaitingDecisionRef.current = false;
        pendingMeetLinkRef.current = null;
        try {
            await meetCoreClient?.clearWaitingRoomJoinRequest();
        } catch (error) {
            reportMeetError('Failed to clear waiting room join request', { context: { error } });
        }
        try {
            await meetCoreClient?.clearJoinDecisionHandler();
        } catch (error) {
            reportMeetError('Failed to clear waiting room join decision handler', { context: { error } });
        }

        dispatch(setAdmissionStatus(WaitingRoomAdmissionStatus.INACTIVE));
    }, [meetCoreClient, dispatch, reportMeetError]);

    // Local reset to `inactive` (e.g. once admitted and proceeding to join). Does not touch the server.
    const reset = useCallback(() => {
        generationRef.current += 1;
        awaitingDecisionRef.current = false;
        stopPoll();
        dispatch(stopWaitingRoomAdmissionTimer());
        dispatch(setAdmissionStatus(WaitingRoomAdmissionStatus.INACTIVE));
    }, [stopPoll, dispatch]);

    return isMeetWaitingRoomEnabled
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
