import { useCallback, useEffect } from 'react';

import { c } from 'ttag';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useUpdateMeetingWaitingRoom } from '@proton/meet/hooks/useUpdateMeetingWaitingRoom';
import { useMeetDispatch, useMeetSelector, useMeetStore } from '@proton/meet/store/hooks';
import { updateMeeting } from '@proton/meet/store/slices/meetings';
import { selectWaitingRoomSetting, setWaitingRoomSetting } from '@proton/meet/store/slices/settings';
import {
    addWaitingParticipant,
    pruneExpiredWaitingParticipants,
    removeWaitingParticipant,
    removeWaitingParticipants,
    resetWaitingRoom,
    selectWaitingParticipants,
} from '@proton/meet/store/slices/waitingRoomSlice';
import type { MeetState } from '@proton/meet/store/store';
import { getWaitTimeBucket } from '@proton/meet/telemetry/buckets';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { SECOND } from '@proton/shared/lib/constants';
import { WaitingRoomState } from '@proton/shared/lib/interfaces/Meet';

import { useMeetCoreClient } from '../../../contexts/MeetCoreClientContext';
import {
    clearWaitingRoomJoinRequestCallback,
    setWaitingRoomJoinRequestCallback,
} from '../../../wasm/waitingRoomCallbacks';
import { useNotifyError } from '../../useNotifyError';
import { useStableCallback } from '../../useStableCallback';
import type { GetSessionKeyBase64 } from '../useSessionKey';

// Captured before the request is handled, as handled requests are removed from the store
const captureAdmissionTelemetry = (state: MeetState, admissionDecision: 'admit' | 'deny') => {
    const now = Date.now();
    const requests = selectWaitingParticipants(state);

    return (handledRequestIds: string[]) =>
        requests
            .filter((request) => handledRequestIds.includes(request.requestId))
            .forEach((request) =>
                sendMeetActionsEvent(TelemetryMeetActionsEvents.waiting_room_admission_handled, {
                    admissionDecision,
                    waitTimeBucket: getWaitTimeBucket(now - request.receivedAt),
                })
            );
};

export const useHostWaitingRoom = ({
    meetingLinkName,
    enabled,
    getSessionKeyBase64,
}: {
    meetingLinkName: string;
    enabled: boolean;
    getSessionKeyBase64: GetSessionKeyBase64;
}) => {
    const dispatch = useMeetDispatch();
    const meetCoreClient = useMeetCoreClient();
    const notifyError = useNotifyError();
    const { reportMeetError } = useMeetErrorReporting();
    const { updateMeetingWaitingRoom } = useUpdateMeetingWaitingRoom();

    const waitingRoomSetting = useMeetSelector(selectWaitingRoomSetting);
    const store = useMeetStore();

    useEffect(() => {
        if (!enabled) {
            return;
        }

        setWaitingRoomJoinRequestCallback((change, requestId, participantUid, expiresAt) => {
            if (change === 0) {
                dispatch(
                    addWaitingParticipant({
                        requestId,
                        participantUid,
                        expiresAt: Number(expiresAt) * SECOND,
                        receivedAt: Date.now(),
                    })
                );
            } else {
                dispatch(removeWaitingParticipant(requestId));
            }
        });

        return () => {
            clearWaitingRoomJoinRequestCallback();
            void meetCoreClient.clearJoinRequestHandler().catch((error) => {
                reportMeetError('Failed to clear waiting room join request handler', { context: { error } });
            });
            dispatch(resetWaitingRoom());
        };
    }, [enabled, meetCoreClient, dispatch, reportMeetError]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const prune = () => dispatch(pruneExpiredWaitingParticipants(Date.now()));
        prune();

        const interval = setInterval(prune, SECOND);
        return () => clearInterval(interval);
    }, [enabled, dispatch]);

    const admitRequest = useCallback(
        async (requestId: string) => {
            const sendAdmissionTelemetry = captureAdmissionTelemetry(store.getState(), 'admit');
            try {
                const sessionKeyBase64 = await getSessionKeyBase64(meetingLinkName);
                if (!sessionKeyBase64) {
                    throw new Error('Missing session key');
                }

                await meetCoreClient.admitWaitingRoomJoinRequest(meetingLinkName, requestId, sessionKeyBase64);
                sendAdmissionTelemetry([requestId]);
                dispatch(removeWaitingParticipant(requestId));
            } catch (error) {
                notifyError(c('Error').t`Failed to admit the participant. Please try again.`);
                reportMeetError('Failed to admit waiting room join request', {
                    context: { error, requestId },
                });
            }
        },
        [dispatch, getSessionKeyBase64, meetCoreClient, meetingLinkName, notifyError, reportMeetError, store]
    );

    const rejectRequest = useCallback(
        async (requestId: string, participantUid: string) => {
            const sendAdmissionTelemetry = captureAdmissionTelemetry(store.getState(), 'deny');
            try {
                await meetCoreClient.rejectWaitingRoomJoinRequest(meetingLinkName, requestId, participantUid);
                sendAdmissionTelemetry([requestId]);
                dispatch(removeWaitingParticipant(requestId));
            } catch (error) {
                notifyError(c('Error').t`Failed to deny the participant. Please try again.`);
                reportMeetError('Failed to reject waiting room join request', {
                    context: { error, requestId },
                });
            }
        },
        [dispatch, meetCoreClient, meetingLinkName, notifyError, reportMeetError, store]
    );

    const admitAll = useStableCallback(async () => {
        const sendAdmissionTelemetry = captureAdmissionTelemetry(store.getState(), 'admit');
        try {
            const sessionKeyBase64 = await getSessionKeyBase64(meetingLinkName);
            if (!sessionKeyBase64) {
                throw new Error('Missing session key');
            }

            const admittedRequestIds = await meetCoreClient.admitAllWaitingRoomJoinRequests(
                meetingLinkName,
                sessionKeyBase64
            );

            sendAdmissionTelemetry(admittedRequestIds);
            dispatch(removeWaitingParticipants(admittedRequestIds));
        } catch (error) {
            notifyError(c('Error').t`Failed to admit the participants. Please try again.`);
            reportMeetError('Failed to admit all waiting room join requests', {
                context: { error },
            });
        }
    });

    const toggleWaitingRoom = useCallback(
        async (newValue: boolean = !waitingRoomSetting) => {
            try {
                const sessionKeyBase64 = await getSessionKeyBase64(meetingLinkName);
                if (!sessionKeyBase64) {
                    throw new Error('Missing session key');
                }

                await meetCoreClient.updateWaitingRoomSetting(meetingLinkName, newValue, sessionKeyBase64);
                if (newValue) {
                    await meetCoreClient.setJoinRequestHandler();
                } else {
                    await meetCoreClient.clearJoinRequestHandler();
                }
                dispatch(setWaitingRoomSetting(newValue));
            } catch (error) {
                notifyError(c('Error').t`Failed to update waiting room setting. Please try again.`);
                reportMeetError('Failed to update waiting room setting in-call', {
                    context: { error, value: newValue },
                });
            }
        },
        [
            dispatch,
            getSessionKeyBase64,
            meetCoreClient,
            meetingLinkName,
            notifyError,
            reportMeetError,
            waitingRoomSetting,
        ]
    );

    const toggleWaitingRoomPrejoin = useCallback(
        async (newValue: boolean = !waitingRoomSetting) => {
            try {
                const meeting = await updateMeetingWaitingRoom({
                    meetingLinkName,
                    waitingRoom: newValue ? WaitingRoomState.ENABLED : WaitingRoomState.DISABLED,
                });
                dispatch(setWaitingRoomSetting(newValue));
                dispatch(updateMeeting(meeting));
            } catch (error) {
                notifyError(
                    getApiErrorMessage(error) ?? c('Error').t`Failed to update waiting room setting. Please try again.`
                );
            }
        },
        [dispatch, meetingLinkName, notifyError, updateMeetingWaitingRoom, waitingRoomSetting]
    );

    return {
        admitRequest,
        rejectRequest,
        admitAll,
        toggleWaitingRoom,
        toggleWaitingRoomPrejoin,
    };
};
