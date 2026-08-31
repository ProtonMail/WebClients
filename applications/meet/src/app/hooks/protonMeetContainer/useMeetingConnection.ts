import { type MutableRefObject, useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { RejoinReasonInfo } from '@proton-meet/proton-meet-core';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import {
    setIsReconnecting,
    setJoinedRoom,
    setMlsRetrying,
    setPrejoinParticipantCount,
    setReconnectionFailed,
} from '@proton/meet/store/slices/connectionSlice';
import { addKeyRotationLog } from '@proton/meet/store/slices/meetingInfo';
import { resetParticipantMaps } from '@proton/meet/store/slices/participants/participantsSlice';
import { encryptDisplayNameWithKey } from '@proton/meet/utils/cryptoUtils';
import { sanitizeMessage } from '@proton/sanitize/purify';
import { SECOND } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import type { InitializeDevices } from '../../types';
import type { ProtonMeetKeyProvider } from '../../utils/ProtonMeetKeyProvider';
import type { KeyRotationScheduler } from '../../utils/SeamlessKeyRotationScheduler';
import { useMeetingAuthentication } from '../srp/useMeetingAuthentication';
import type { UseKeyManagementResult } from '../useKeyManagement';
import type { UseLiveKitConnectionResult } from '../useLiveKitConnection';
import { useStableCallback } from '../useStableCallback';
import type { UseMlsSessionResult } from './useMlsSession';

export interface MeetingAccessDetails {
    accessToken: string;
    websocketUrl: string;
}

export interface ConnectWithMlsParams {
    meetingToken: string;
    meetingPassword: string;
    displayName: string;
    timeoutMs: number;
    queryParticipantsCount?: boolean;
    desiredCameraState?: boolean;
    desiredMicrophoneState?: boolean;
    resetParticipantsBeforeFetch?: boolean;
    isWaitingRoom?: boolean;
    accessDetails?: MeetingAccessDetails;
}

type ConnectionInfo = Awaited<ReturnType<UseLiveKitConnectionResult['connectWithStunFallbackToTurnRelay']>>;

export interface ConnectWithMlsResult {
    connectionInfo: ConnectionInfo;
    tokenFetchMs: number;
    mlsSetupMs: number;
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
    getParticipants: (token: string) => Promise<void>;
    getQueryParticipantsCount: (meetingLinkName: string) => Promise<number | undefined>;
    reportMeetError: (msg: string, options?: unknown) => void;
    triggerFullReconnectionRef: MutableRefObject<(reason: RejoinReasonInfo) => void>;
}

export interface UseMeetingConnectionResult {
    isReconnectingRef: MutableRefObject<boolean>;
    websocketUrlRef: MutableRefObject<string | null>;
    performFullReconnection: (reason: RejoinReasonInfo) => Promise<void>;
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

    const dispatch = useMeetDispatch();
    const { getAccessDetails } = useMeetingAuthentication();
    const meetCoreClient = useMeetCoreClient();
    const room = useRoomContext();

    const isReconnectingRef = useRef(false);
    const websocketUrlRef = useRef<string | null>(null);

    // Shared connect sequence used by both the initial join (useJoinFlow) and reconnection.
    const connectWithMls = useStableCallback(
        async ({
            meetingToken,
            meetingPassword: password,
            displayName: displayNameArg,
            timeoutMs,
            queryParticipantsCount = false,
            desiredCameraState,
            desiredMicrophoneState,
            resetParticipantsBeforeFetch = false,
            isWaitingRoom = false,
            accessDetails,
        }: ConnectWithMlsParams): Promise<ConnectWithMlsResult> => {
            const fetchAccessDetails = async () => {
                const sanitizedDisplayName = sanitizeMessage(displayNameArg);
                const encryptedDisplayName = decryptionKeyRef.current
                    ? await encryptDisplayNameWithKey(decryptionKeyRef.current, sanitizedDisplayName)
                    : '';

                return getAccessDetails({ token: meetingToken, encryptedDisplayName });
            };

            const t0 = performance.now();
            const { websocketUrl, accessToken } = accessDetails ?? (await fetchAccessDetails());
            const tokenFetchMs = Math.round(performance.now() - t0);

            websocketUrlRef.current = websocketUrl;
            accessTokenRef.current = accessToken;

            let participantCountPromise: Promise<number | undefined>;
            if (queryParticipantsCount) {
                // Fire-and-forget: populates the prejoin loader count without blocking the join
                participantCountPromise = getQueryParticipantsCount(meetingToken);
                void participantCountPromise.then((count) => dispatch(setPrejoinParticipantCount(count ?? 0)));
            } else {
                participantCountPromise = Promise.resolve(undefined);
            }

            const t1 = performance.now();
            const { key: groupKey, epoch } =
                (await handleMlsSetup(meetingToken, accessToken, password, isWaitingRoom)) || {};
            const mlsSetupMs = Math.round(performance.now() - t1);

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

            let connectionInfo: ConnectionInfo;
            let livekitConnectMs: number;
            let deviceInitMs: number;
            try {
                await room.setE2EEEnabled(true);
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
                await initDevices;
                deviceInitMs = Math.round(performance.now() - t2);
            } catch (livekitError) {
                // If LiveKit connection fails after MLS join, clean up MLS group to prevent inconsistent state
                try {
                    await meetCoreClient.leaveMeeting();
                } catch (leaveError) {
                    reportMeetError('Failed to leave MLS group after LiveKit connection failure', {
                        context: { error: leaveError },
                    });
                }
                disallowHealthCheck();
                cleanupMlsState();
                throw livekitError;
            }

            if (resetParticipantsBeforeFetch) {
                dispatch(resetParticipantMaps());
            }
            await getParticipants(meetingToken);

            return {
                connectionInfo,
                tokenFetchMs,
                mlsSetupMs,
                livekitConnectMs,
                deviceInitMs,
                websocketUrl,
                participantCountPromise,
            };
        }
    );

    const performFullReconnection = useStableCallback(async (reason: RejoinReasonInfo) => {
        if (isReconnectingRef.current || !meetingLinkNameRef.current) {
            return;
        }
        isReconnectingRef.current = true;
        const reconnectionStartTimeMs = BigInt(Date.now());

        dispatch(setIsReconnecting(true));
        dispatch(setReconnectionFailed(false));
        dispatch(setMlsRetrying(false));
        disallowHealthCheck();

        const meetingToken = meetingLinkNameRef.current;

        try {
            // Snapshot before room.disconnect() — the Disconnected handler clears this ref synchronously
            const wasMlsActive = mlsSetupDone.current;

            // Snapshot the live camera/mic state so it survives the rejoin; otherwise
            // initializeDevices falls back to the prejoin defaults and silently turns them off.
            const wasCameraEnabled = room.localParticipant.isCameraEnabled;
            const wasMicrophoneEnabled = room.localParticipant.isMicrophoneEnabled;

            try {
                await room.disconnect();
            } catch {
                // best effort
            }

            // Always await leaveMeeting when MLS was active. We do this here (not in the disconnect
            // handler) so it is properly awaited before joinMeetingWithAccessToken is called below.
            if (wasMlsActive) {
                try {
                    await meetCoreClient.leaveMeeting();
                } catch {
                    // best effort
                }
                mlsSetupDone.current = false;
            }

            cleanupMlsState();

            await connectWithMls({
                meetingToken,
                meetingPassword,
                displayName,
                timeoutMs: 20 * SECOND,
                desiredCameraState: wasCameraEnabled,
                desiredMicrophoneState: wasMicrophoneEnabled,
                resetParticipantsBeforeFetch: true,
            });

            meetingLinkNameRef.current = meetingToken;
            dispatch(setJoinedRoom(true));
            dispatch(setIsReconnecting(false));
            isReconnectingRef.current = false;
            allowHealthCheck();

            if (isMeetClientMetricsLogEnabled) {
                const rejoinTimeMs = BigInt(Date.now()) - reconnectionStartTimeMs;
                await meetCoreClient
                    .logUserRejoin(rejoinTimeMs, 1, reason, true)
                    .catch((error: unknown) =>
                        reportMeetError('Failed to log reconnection success', { context: { error } })
                    );
            }
        } catch (error) {
            reportMeetError('Full reconnection failed', { context: { error } });

            // Best-effort MLS leave in case handleMlsSetup succeeded but a later step failed
            if (mlsSetupDone.current) {
                try {
                    await meetCoreClient.leaveMeeting();
                } catch {
                    // best effort
                }
            }
            cleanupMlsState();

            dispatch(setIsReconnecting(false));
            isReconnectingRef.current = false;
            dispatch(setReconnectionFailed(true));
            // Clear stored credentials so the next attempt (manual rejoin) fetches fresh ones
            accessTokenRef.current = null;
            websocketUrlRef.current = null;

            if (isMeetClientMetricsLogEnabled) {
                const rejoinTimeMs = BigInt(Date.now()) - reconnectionStartTimeMs;
                await meetCoreClient
                    ?.logUserRejoin(rejoinTimeMs, 1, reason, false)
                    .catch((error: unknown) =>
                        reportMeetError('Failed to log reconnection failure', { context: { error } })
                    );
            }
        }
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
        connectWithMls,
    };
};
