import { type MutableRefObject, useEffect, useRef } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { RejoinReasonInfo } from '@proton-meet/proton-meet-core';
import { logger } from '@protontech/logger';
import { ConnectionState } from 'livekit-client';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import {
    setIsReconnecting,
    setJoinedRoom,
    setMlsRetrying,
    setPrejoinParticipantCount,
    setReconnectionFailed,
} from '@proton/meet/store/slices/connectionSlice';
import { addKeyRotationLog } from '@proton/meet/store/slices/currentMeeting';
import { resetParticipantMaps } from '@proton/meet/store/slices/participants/participantsSlice';
import { encryptDisplayNameWithKey } from '@proton/meet/utils/cryptoUtils';
import { sanitizeMessage } from '@proton/sanitize/purify';
import { SECOND } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import type { InitializeDevices } from '../../types';
import type { ProtonMeetKeyProvider } from '../../utils/ProtonMeetKeyProvider';
import type { KeyRotationScheduler } from '../../utils/SeamlessKeyRotationScheduler';
import {
    MEET_CORE_JOIN_TIMEOUT_MS,
    callMeetCoreWithinDeadline,
    leaveMeetingOrRestart,
} from '../../wasm/meetCoreStallRecovery';
import { useMeetingAuthentication } from '../srp/useMeetingAuthentication';
import type { UseKeyManagementResult } from '../useKeyManagement';
import type { UseLiveKitConnectionResult } from '../useLiveKitConnection';
import { useStableCallback } from '../useStableCallback';
import { REJOIN_RETRY_DELAYS_MS, type RejoinOutcome, runRejoinAttempts } from './rejoinAttempts';
import {
    AUTOMATIC_REJOIN_RUN_LIMIT,
    AUTOMATIC_REJOIN_RUN_WINDOW_MS,
    canStartAutomaticRejoinRun,
    recordAutomaticRejoinRunStart,
} from './rejoinRunLimit';
import type { UseMlsSessionResult } from './useMlsSession';

export interface MeetingAccessDetails {
    accessToken: string;
    websocketUrl: string;
}

interface ConnectWithMlsParams {
    meetingLinkName: string;
    meetingPassword: string;
    displayName: string;
    timeoutMs: number;
    queryParticipantsCount?: boolean;
    desiredCameraState?: boolean;
    desiredMicrophoneState?: boolean;
    resetParticipantsBeforeFetch?: boolean;
    isWaitingRoom?: boolean;
    accessDetails?: MeetingAccessDetails;
    signal?: AbortSignal;
    recoverStalledMeetCore?: boolean;
    notifyOnGenericMlsError?: boolean;
}

type ConnectionInfo = Awaited<ReturnType<UseLiveKitConnectionResult['connectWithStunFallbackToTurnRelay']>>;

export interface ConnectWithMlsResult {
    connectionInfo: ConnectionInfo;
    tokenFetchMs: number;
    mlsSetupMs: number;
    e2eeEnableMs: number;
    livekitConnectMs: number;
    deviceInitMs: number;
    websocketUrl: string;
    participantCountPromise: Promise<number | undefined>;
}

interface UseMeetingConnectionParams {
    meetingLinkNameRef: MutableRefObject<string>;
    meetingPassword: string;
    displayName: string;
    decryptionKeyRef: MutableRefObject<CryptoKey | null>;
    mlsSetupDone: MutableRefObject<boolean>;
    accessTokenRef: MutableRefObject<string | null>;
    keyProvider: ProtonMeetKeyProvider;
    keyRotationScheduler: KeyRotationScheduler;
    handleMlsSetup: UseMlsSessionResult['handleMlsSetup'];
    reportMLSRelatedError: UseKeyManagementResult['reportMLSRelatedError'];
    connectWithStunFallbackToTurnRelay: UseLiveKitConnectionResult['connectWithStunFallbackToTurnRelay'];
    cleanupMlsState: () => void;
    allowHealthCheck: () => void;
    disallowHealthCheck: () => void;
    initializeDevices: InitializeDevices;
    getParticipants: (meetingLinkName: string) => Promise<void>;
    getQueryParticipantsCount: (meetingLinkName: string) => Promise<number | undefined>;
    reportMeetError: (msg: string, options?: unknown) => void;
    triggerFullReconnectionRef: MutableRefObject<(reason: RejoinReasonInfo) => void>;
}

type RejoinStatus = RejoinOutcome['status'] | 'skipped';

type PerformFullReconnection = (reason: RejoinReasonInfo, options?: { manual?: boolean }) => Promise<RejoinStatus>;

export interface UseMeetingConnectionResult {
    isReconnectingRef: MutableRefObject<boolean>;
    websocketUrlRef: MutableRefObject<string | null>;
    performFullReconnection: PerformFullReconnection;
    cancelReconnection: () => void;
    connectWithMls: (params: ConnectWithMlsParams) => Promise<ConnectWithMlsResult>;
}

export const useMeetingConnection = ({
    meetingLinkNameRef,
    meetingPassword,
    displayName,
    decryptionKeyRef,
    mlsSetupDone,
    accessTokenRef,
    keyProvider,
    keyRotationScheduler,
    handleMlsSetup,
    reportMLSRelatedError,
    connectWithStunFallbackToTurnRelay,
    cleanupMlsState,
    allowHealthCheck,
    disallowHealthCheck,
    initializeDevices,
    getParticipants,
    getQueryParticipantsCount,
    reportMeetError,
    triggerFullReconnectionRef,
}: UseMeetingConnectionParams): UseMeetingConnectionResult => {
    const isMeetSeamlessKeyRotationEnabled = useFlag('MeetSeamlessKeyRotationEnabled');
    const isMeetClientMetricsLogEnabled = useFlag('MeetClientMetricsLog');
    const isHandleStalledLiveKitReconnectEnabled = useFlag('MeetHandleStalledLiveKitReconnect');

    const dispatch = useMeetDispatch();
    const { getAccessDetails } = useMeetingAuthentication();
    const meetCoreClient = useMeetCoreClient();
    const room = useRoomContext();

    const isReconnectingRef = useRef(false);
    const rejoinControllerRef = useRef<AbortController | null>(null);
    const websocketUrlRef = useRef<string | null>(null);
    const automaticRunStartTimesMsRef = useRef<readonly number[]>([]);
    const { isCameraEnabled, isMicrophoneEnabled } = useLocalParticipant();
    const lastLiveDeviceStateRef = useRef({ camera: false, microphone: false });

    useEffect(() => () => rejoinControllerRef.current?.abort(), []);

    // Not recorded while Disconnected: LiveKit unpublishes local tracks before it reports Disconnected.
    useEffect(() => {
        const isRoomLive = [
            ConnectionState.Connected,
            ConnectionState.Reconnecting,
            ConnectionState.SignalReconnecting,
        ].includes(room.state);
        if (isRoomLive && !isReconnectingRef.current) {
            lastLiveDeviceStateRef.current = { camera: isCameraEnabled, microphone: isMicrophoneEnabled };
        }
    });

    // Shared connect sequence used by both the initial join (useJoinFlow) and reconnection.
    const connectWithMls = useStableCallback(
        async ({
            meetingLinkName,
            meetingPassword: password,
            displayName: displayNameArg,
            timeoutMs,
            queryParticipantsCount = false,
            desiredCameraState,
            desiredMicrophoneState,
            resetParticipantsBeforeFetch = false,
            isWaitingRoom = false,
            accessDetails,
            signal,
            recoverStalledMeetCore = false,
            notifyOnGenericMlsError = true,
        }: ConnectWithMlsParams): Promise<ConnectWithMlsResult> => {
            const fetchAccessDetails = async () => {
                const sanitizedDisplayName = sanitizeMessage(displayNameArg);
                const encryptedDisplayName = decryptionKeyRef.current
                    ? await encryptDisplayNameWithKey(decryptionKeyRef.current, sanitizedDisplayName)
                    : '';

                return getAccessDetails({ meetingLinkName, encryptedDisplayName });
            };

            const t0 = performance.now();
            const { websocketUrl, accessToken } = accessDetails ?? (await fetchAccessDetails());
            const tokenFetchMs = Math.round(performance.now() - t0);
            signal?.throwIfAborted();

            websocketUrlRef.current = websocketUrl;
            accessTokenRef.current = accessToken;

            let participantCountPromise: Promise<number | undefined>;
            if (queryParticipantsCount) {
                // Fire-and-forget: populates the prejoin loader count without blocking the join
                participantCountPromise = getQueryParticipantsCount(meetingLinkName);
                void participantCountPromise.then((count) => dispatch(setPrejoinParticipantCount(count ?? 0)));
            } else {
                participantCountPromise = Promise.resolve(undefined);
            }

            const t1 = performance.now();
            const setupMls = () =>
                handleMlsSetup(meetingLinkName, accessToken, password, isWaitingRoom, notifyOnGenericMlsError);
            const { key: groupKey, epoch } =
                (await (recoverStalledMeetCore
                    ? callMeetCoreWithinDeadline(meetCoreClient, setupMls, {
                          name: 'joinMeeting',
                          reportMeetError,
                          timeoutMs: MEET_CORE_JOIN_TIMEOUT_MS,
                          signal,
                      })
                    : setupMls())) || {};
            const mlsSetupMs = Math.round(performance.now() - t1);
            signal?.throwIfAborted();

            reportMLSRelatedError(groupKey, epoch);

            if (!groupKey || !epoch) {
                throw new Error('Group key or epoch is missing');
            }

            dispatch(
                addKeyRotationLog({
                    timestamp: Date.now(),
                    epoch: Number(epoch),
                    type: 'log',
                    message: 'Key rotation successful',
                })
            );

            if (isMeetSeamlessKeyRotationEnabled) {
                await keyRotationScheduler.schedule(groupKey, epoch);
            } else {
                await keyProvider.setKeyWithEpoch(groupKey, epoch);
            }
            signal?.throwIfAborted();

            let connectionInfo: ConnectionInfo;
            let e2eeEnableMs: number;
            let livekitConnectMs: number;
            let deviceInitMs: number;
            let participantsFetch: Promise<void> | undefined;
            try {
                const e2eeStart = performance.now();
                await room.setE2EEEnabled(true);
                e2eeEnableMs = Math.round(performance.now() - e2eeStart);
                // Start device init concurrently with connect so the camera track is included in the initial SDP
                // offer rather than a post-connect renegotiation (on Safari with H264 that can fail silently).
                const t2 = performance.now();
                const initDevices = initializeDevices({
                    timeoutMs: 5 * SECOND,
                    desiredCameraState,
                    desiredMicrophoneState,
                });
                connectionInfo = await connectWithStunFallbackToTurnRelay(websocketUrl, accessToken, timeoutMs);
                livekitConnectMs = Math.round(performance.now() - t2);
                if (!signal?.aborted) {
                    if (resetParticipantsBeforeFetch) {
                        dispatch(resetParticipantMaps());
                    }
                    // The backend lists the local participant only once LiveKit does, so this is the earliest it can run
                    participantsFetch = getParticipants(meetingLinkName);
                }
                await initDevices;
                deviceInitMs = Math.round(performance.now() - t2);
            } catch (livekitError) {
                if (signal?.aborted) {
                    throw livekitError;
                }
                // If LiveKit connection fails after MLS join, clean up MLS group to prevent inconsistent state
                try {
                    await (recoverStalledMeetCore
                        ? leaveMeetingOrRestart(meetCoreClient, reportMeetError)
                        : meetCoreClient.leaveMeeting());
                } catch (leaveError) {
                    reportMeetError('Failed to leave MLS group after LiveKit connection failure', {
                        context: { error: leaveError },
                    });
                }
                disallowHealthCheck();
                cleanupMlsState();
                throw livekitError;
            }
            if (signal?.aborted) {
                void room.disconnect();
                signal.throwIfAborted();
            }

            await participantsFetch;

            return {
                connectionInfo,
                tokenFetchMs,
                mlsSetupMs,
                e2eeEnableMs,
                livekitConnectMs,
                deviceInitMs,
                websocketUrl,
                participantCountPromise,
            };
        }
    );

    const endRun = () => {
        rejoinControllerRef.current = null;
        isReconnectingRef.current = false;
    };

    const performFullReconnection = useStableCallback<PerformFullReconnection>(async (reason, { manual } = {}) => {
        if (isReconnectingRef.current || !meetingLinkNameRef.current) {
            return 'skipped';
        }

        const nowMs = Date.now();
        const isLimitedAutomaticRun = isHandleStalledLiveKitReconnectEnabled && !manual;
        const isOverAutomaticRunLimit =
            isLimitedAutomaticRun && !canStartAutomaticRejoinRun(automaticRunStartTimesMsRef.current, nowMs);
        if (manual) {
            automaticRunStartTimesMsRef.current = [];
        } else if (isLimitedAutomaticRun && !isOverAutomaticRunLimit) {
            automaticRunStartTimesMsRef.current = recordAutomaticRejoinRunStart(
                automaticRunStartTimesMsRef.current,
                nowMs
            );
        }

        const controller = new AbortController();
        const { signal } = controller;
        rejoinControllerRef.current = controller;
        isReconnectingRef.current = true;
        const reconnectionStartTimeMs = BigInt(Date.now());

        const trackUserRejoin = async (success: boolean, attempts: number) => {
            const rejoinTimeMs = BigInt(Date.now()) - reconnectionStartTimeMs;
            logger.info('[telemetry] logUserRejoin', {
                rejoinTimeMs: Number(rejoinTimeMs),
                reason: RejoinReasonInfo[reason],
                attempts,
                success,
            });

            if (!isMeetClientMetricsLogEnabled) {
                return;
            }

            await meetCoreClient
                .logUserRejoin(rejoinTimeMs, attempts, reason, success)
                .catch((error: unknown) =>
                    reportMeetError(
                        success ? 'Failed to log reconnection success' : 'Failed to log reconnection failure',
                        { context: { error } }
                    )
                );
        };

        dispatch(setIsReconnecting(true));
        dispatch(setReconnectionFailed(false));
        dispatch(setMlsRetrying(false));
        disallowHealthCheck();

        const meetingLinkName = meetingLinkNameRef.current;

        const { camera: cameraEnabledBeforeRejoin, microphone: microphoneEnabledBeforeRejoin } =
            lastLiveDeviceStateRef.current;

        const leaveMlsGroup = () =>
            isHandleStalledLiveKitReconnectEnabled
                ? leaveMeetingOrRestart(meetCoreClient, reportMeetError)
                : meetCoreClient.leaveMeeting();

        const leaveRoomAndMeetCore = async () => {
            // Snapshot before room.disconnect() — the Disconnected handler clears this ref synchronously
            const wasMlsActive = mlsSetupDone.current;

            try {
                await room.disconnect();
            } catch {
                // best effort
            }
            signal.throwIfAborted();

            // Always await leaveMeeting when MLS was active. We do this here (not in the disconnect
            // handler) so it is properly awaited before a rejoin calls joinMeetingWithAccessToken.
            if (wasMlsActive) {
                try {
                    await leaveMlsGroup();
                } catch {
                    // best effort
                }
                signal.throwIfAborted();
                mlsSetupDone.current = false;
            }

            cleanupMlsState();
        };

        const rejoin = async () => {
            await leaveRoomAndMeetCore();
            await connectWithMls({
                meetingLinkName,
                meetingPassword,
                displayName,
                timeoutMs: 20 * SECOND,
                desiredCameraState: cameraEnabledBeforeRejoin,
                desiredMicrophoneState: microphoneEnabledBeforeRejoin,
                resetParticipantsBeforeFetch: true,
                signal,
                recoverStalledMeetCore: isHandleStalledLiveKitReconnectEnabled,
                notifyOnGenericMlsError: !isHandleStalledLiveKitReconnectEnabled,
            });
        };

        const failWithoutRejoining = async (): Promise<RejoinOutcome> => {
            await leaveRoomAndMeetCore().catch(noop);
            return signal.aborted
                ? { status: 'cancelled', attempts: 0 }
                : { status: 'failed', attempts: 0, error: undefined };
        };

        const outcome = isOverAutomaticRunLimit
            ? await failWithoutRejoining()
            : await runRejoinAttempts(rejoin, {
                  signal,
                  retryDelaysMs: isHandleStalledLiveKitReconnectEnabled ? REJOIN_RETRY_DELAYS_MS : [],
                  waitWhileOffline: isHandleStalledLiveKitReconnectEnabled,
              });

        if (outcome.status === 'cancelled') {
            return 'cancelled';
        }

        if (outcome.status === 'joined') {
            dispatch(setJoinedRoom(true));
            dispatch(setIsReconnecting(false));
            endRun();
            allowHealthCheck();
        } else {
            if (isOverAutomaticRunLimit) {
                reportMeetError('Automatic rejoin limit reached', {
                    level: 'warning',
                    context: { runs: AUTOMATIC_REJOIN_RUN_LIMIT, windowMs: AUTOMATIC_REJOIN_RUN_WINDOW_MS },
                });
            } else {
                reportMeetError('Full reconnection failed', {
                    context: { error: outcome.error, attempts: outcome.attempts },
                });
            }

            // Best-effort MLS leave in case handleMlsSetup succeeded but a later step failed
            if (mlsSetupDone.current) {
                try {
                    await leaveMlsGroup();
                } catch {
                    // best effort
                }
                if (signal.aborted) {
                    return 'cancelled';
                }
            }
            disallowHealthCheck();
            cleanupMlsState();

            dispatch(setIsReconnecting(false));
            endRun();
            dispatch(setReconnectionFailed(true));
            // Clear stored credentials so the next attempt (manual rejoin) fetches fresh ones
            accessTokenRef.current = null;
            websocketUrlRef.current = null;
        }

        await trackUserRejoin(outcome.status === 'joined', outcome.attempts);

        return outcome.status;
    });

    const cancelReconnection = useStableCallback(() => {
        automaticRunStartTimesMsRef.current = [];
        const controller = rejoinControllerRef.current;
        if (!controller) {
            return;
        }
        endRun();
        controller.abort();
        dispatch(setIsReconnecting(false));
    });

    // Keep the stable ref in sync so callbacks registered before performFullReconnection was defined
    // (e.g. useConnectionHealthCheck's onMlsFailed) always call the latest version.
    useEffect(() => {
        triggerFullReconnectionRef.current = performFullReconnection;
    }, [performFullReconnection, triggerFullReconnectionRef]);

    return {
        isReconnectingRef,
        websocketUrlRef,
        performFullReconnection,
        cancelReconnection,
        connectWithMls,
    };
};
