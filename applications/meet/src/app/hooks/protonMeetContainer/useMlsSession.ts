import { type MutableRefObject, useEffect, useRef } from 'react';

import { MeetCoreErrorEnum, MlsSyncStateInfo, RejoinReasonInfo } from '@proton-meet/proton-meet-core';
import { c } from 'ttag';

import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useMeetErrorReporting } from '@proton/meet';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { setMlsRetrying } from '@proton/meet/store/slices/connectionSlice';
import { setMlsGroupState } from '@proton/meet/store/slices/meetingInfo';
import { selectCaptionsAgentPresent } from '@proton/meet/store/slices/participants/agentParticipantsSlice';
import type { MLSGroupState } from '@proton/meet/types/types';

import { CAPTIONS_AGENT_RETRY_DELAYS_MS } from '../../constants';
import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { retry } from '../../utils/retry';
import {
    setupAgentLeftEvent,
    setupAgentPendingEvent,
    setupLiveKitAdminChangeEvent,
    setupWasmDependencies,
} from '../../utils/wasmUtils';
import { useLiveCaptionsFeatureEnabled } from '../captions/useLiveCaptionsFeatureEnabled';
import { useNotifyError } from '../useNotifyError';

interface UseMlsSessionParams {
    getGroupKeyInfo: () => Promise<{ key: string; epoch: bigint }>;
    onNewGroupKeyInfo: (key: string, epoch: bigint) => Promise<void>;
    updateAdminParticipant: (roomId: string, participantUid: string, participantType: Number) => Promise<void>;
    allowHealthCheck: () => void;
    triggerFullReconnectionRef: MutableRefObject<(reason: RejoinReasonInfo) => void>;
    currentKeyRef: MutableRefObject<string | null>;
    mlsGroupStateRef: MutableRefObject<MLSGroupState | null>;
}

export interface UseMlsSessionResult {
    mlsSetupDone: MutableRefObject<boolean>;
    handleMlsSetup: (
        meetingLinkName: string,
        accessToken: string,
        meetingPassword: string,
        isWaitingRoom?: boolean
    ) => Promise<{ key: string; epoch: bigint } | undefined>;
}

// Grace before a catch-up pass, so the pending-agent event can do the work first.
export const RECONCILE_DELAY_MS = 2_000;

// How long an admission we have already made is assumed to still be settling. Past that, an agent
// the backend keeps listing as pending never made it into the group and is admitted again. It has to
// outlast the retries an admission makes, or a sweep would start a second one alongside the first.
export const ADMISSION_SETTLE_MS = CAPTIONS_AGENT_RETRY_DELAYS_MS.reduce((total, delay) => total + delay, 0) + 5_000;

interface AgentAdmissionController {
    admitPendingAgents: () => Promise<void>;
}

const getMeetCoreErrorName = (error: unknown) =>
    typeof error === 'number' ? MeetCoreErrorEnum[error] || `MeetCoreError(${error})` : String(error);

export const useMlsSession = ({
    getGroupKeyInfo,
    onNewGroupKeyInfo,
    updateAdminParticipant,
    allowHealthCheck,
    triggerFullReconnectionRef,
    currentKeyRef,
    mlsGroupStateRef,
}: UseMlsSessionParams): UseMlsSessionResult => {
    const meetCoreClient = useMeetCoreClient();

    const { reportMeetError } = useMeetErrorReporting();

    const authentication = useAuthentication();
    const dispatch = useMeetDispatch();
    const notifyError = useNotifyError();

    const mlsSetupDone = useRef(false);

    const captionsAgentPresent = useMeetSelector(selectCaptionsAgentPresent);

    const liveCaptionsEnabled = useLiveCaptionsFeatureEnabled();
    const liveCaptionsEnabledRef = useRef(liveCaptionsEnabled);
    liveCaptionsEnabledRef.current = liveCaptionsEnabled;

    const agentAdmissionRef = useRef<AgentAdmissionController | null>(null);

    // Nothing else retries a missed pending-agent event, which would leave the agent transcribing
    // into a group it isn't part of.
    useEffect(() => {
        const timeout = setTimeout(() => {
            void agentAdmissionRef.current?.admitPendingAgents();
        }, RECONCILE_DELAY_MS);

        return () => clearTimeout(timeout);
    }, [captionsAgentPresent]);

    const startAgentAdmission = (meetingLinkName: string, meetingPassword: string): AgentAdmissionController => {
        // Device ids we have already asked to admit, and when we first asked, so a sweep can tell
        // an admission that is still settling from one that never landed.
        const admittedAt = new Map<string, number>();
        // A first sweep finding pending agents is routine, since they can go pending before we join;
        // a later one finding them means something dropped the work.
        let hasSwept = false;

        // Every client calls this: meet-core staggers the commit by a deterministic rank and drops
        // out if the epoch advanced during the wait, so a wedged low-ranked client can't hold up
        // admission and the others don't race it.
        const admit = async (deviceId: string) => {
            if (admittedAt.has(deviceId)) {
                return;
            }
            admittedAt.set(deviceId, Date.now());

            await retry(() => meetCoreClient.admitAgent(meetingLinkName, deviceId, meetingPassword), {
                delayMs: CAPTIONS_AGENT_RETRY_DELAYS_MS,
                stopAfterFirstSuccess: true,
                // The agent can leave while we back off, leaving nothing to admit.
                shouldAttempt: () => admittedAt.has(deviceId),
                onFailure: (error) => {
                    // Re-arm so a later pending event or sweep can try again.
                    admittedAt.delete(deviceId);
                    reportMeetError('Failed to admit agent after retries', {
                        context: { error },
                    });
                },
            });
        };

        const forgetAgent = async (deviceId: string) => {
            admittedAt.delete(deviceId);
        };

        // Failing here leaves admission to the sweep below rather than to the events, so it is
        // reported instead of failing the join: captions are not worth losing the meeting over.
        const registerAgentEvents = async () => {
            try {
                setupAgentPendingEvent({ onAgentPending: admit });
                await meetCoreClient.setAgentPendingHandler();

                setupAgentLeftEvent({ onAgentLeft: forgetAgent });
                await meetCoreClient.setAgentLeftHandler();
            } catch (error) {
                reportMeetError('Failed to subscribe to captions agent events', {
                    context: { error },
                });
            }
        };

        void registerAgentEvents();

        // Catches up on agents that went pending while we were joining, or whose event we missed.
        const admitPendingAgents = async () => {
            if (!liveCaptionsEnabledRef.current) {
                return;
            }
            const isCatchUp = hasSwept;
            hasSwept = true;

            let pending: string[];
            try {
                pending = await meetCoreClient.listPendingAgents(meetingLinkName);
            } catch (error) {
                reportMeetError('Failed to list pending agents', {
                    context: { error },
                });
                return;
            }

            const now = Date.now();
            const isSettling = (deviceId: string) => {
                const admissionTime = admittedAt.get(deviceId);
                return admissionTime !== undefined && now - admissionTime < ADMISSION_SETTLE_MS;
            };

            const unhandled = pending.filter((deviceId) => !isSettling(deviceId));
            unhandled.forEach((deviceId) => admittedAt.delete(deviceId));

            if (isCatchUp && unhandled.length > 0) {
                reportMeetError('Captions agent was still unadmitted when reconciling', {
                    level: 'warning',
                    context: { unhandled: unhandled.length },
                });
            }

            await Promise.all(unhandled.map(admit));
        };

        return { admitPendingAgents };
    };

    const handleMlsSetup = async (
        meetingLinkName: string,
        accessToken: string,
        meetingPassword: string,
        isWaitingRoom = false
    ): Promise<{ key: string; epoch: bigint } | undefined> => {
        if (!mlsSetupDone.current) {
            mlsSetupDone.current = true;

            setupWasmDependencies({
                getGroupKeyInfo,
                onNewGroupKeyInfo,
                onMlsSyncStateChanged: (state: number) => {
                    if (state === MlsSyncStateInfo.Retrying) {
                        dispatch(setMlsRetrying(true));
                    } else if (state === MlsSyncStateInfo.Failed) {
                        dispatch(setMlsRetrying(false));
                        triggerFullReconnectionRef.current(RejoinReasonInfo.EpochMismatch);
                    } else if (state === MlsSyncStateInfo.Success) {
                        dispatch(setMlsRetrying(false));
                    }
                },
            });
            setupLiveKitAdminChangeEvent({ onLiveKitAdminChanged: updateAdminParticipant });
        }

        try {
            const sessionId = authentication.hasSession() ? authentication.getUID() : null;
            await meetCoreClient.joinMeetingWithAccessTokenWithSwitchJoinType(
                accessToken,
                meetingLinkName,
                meetingPassword,
                sessionId,
                true,
                isWaitingRoom
            );

            await meetCoreClient.setMlsGroupUpdateHandler();
            await meetCoreClient.setLiveKitAdminChangeHandler();
            await meetCoreClient.setMlsSyncStateUpdateHandler();

            if (isWaitingRoom) {
                try {
                    await meetCoreClient.setJoinRequestHandler();
                } catch (error) {
                    reportMeetError('Failed to set waiting room join request handler', {
                        context: { error },
                    });
                }
            }

            agentAdmissionRef.current = startAgentAdmission(meetingLinkName, meetingPassword);
            // Picks up an agent that went pending before this client had a handler registered.
            void agentAdmissionRef.current.admitPendingAgents();

            const groupKeyData = await meetCoreClient.getGroupKey();

            currentKeyRef.current = groupKeyData.key;

            const displayCode = await meetCoreClient.getGroupDisplayCode();
            const nextMlsGroupState = {
                displayCode: displayCode?.full_code || null,
                epoch: Number(groupKeyData.epoch),
            };
            dispatch(setMlsGroupState(nextMlsGroupState));
            mlsGroupStateRef.current = nextMlsGroupState;

            allowHealthCheck();

            return groupKeyData;
        } catch (error) {
            let message: string;
            switch (error) {
                case MeetCoreErrorEnum.MlsServerVersionNotSupported:
                    message = c('Error')
                        .t`This meeting is on an older version, the host must end it and refresh Meet to restart with the latest version.`;
                    break;
                case MeetCoreErrorEnum.CheckDeviceClock:
                    message = c('Error')
                        .t`Your device's clock appears to be out of sync. Please check your system time and try again.`;
                    break;
                case MeetCoreErrorEnum.MaxRetriesReached:
                case MeetCoreErrorEnum.HttpClientError:
                default:
                    // eslint-disable-next-line no-console
                    console.error(error);
                    message = c('Error').t`Failed to join meeting. Please try again later.`;
            }
            notifyError(message);
            const err = new Error(`MLS setup failed: ${getMeetCoreErrorName(error)}`);
            Object.assign(err, { userNotified: true, coreError: error });
            throw err;
        }
    };

    return { mlsSetupDone, handleMlsSetup };
};
