import { type Dispatch, type MutableRefObject, type SetStateAction, useCallback, useEffect, useRef } from 'react';

import type { RejoinReasonInfo } from '@proton-meet/proton-meet-core';
import type { Room } from 'livekit-client';

import { encryptDisplayNameWithKey } from '@proton/meet/utils/cryptoUtils';
import { sanitizeMessage } from '@proton/sanitize/purify';

import type { ProtonMeetKeyProvider } from '../utils/ProtonMeetKeyProvider';
import type { KeyRotationScheduler } from '../utils/SeamlessKeyRotationScheduler';
import type { MeetCoreClient } from '../wasm/MeetCoreClient';
import type { UseLiveKitConnectionResult } from './useLiveKitConnection';
import type { UseMlsSessionResult } from './useMlsSession';

interface GetAccessDetailsParams {
    displayName: string;
    token: string;
    encryptedDisplayName: string;
}

interface UseReconnectionParams {
    wasmApp: MeetCoreClient | null;
    room: Room;
    meetingLinkNameRef: MutableRefObject<string>;
    meetingPassword: string;
    displayName: string;
    decryptionKeyRef: MutableRefObject<CryptoKey | null>;
    mlsSetupDone: MutableRefObject<boolean>;
    accessTokenRef: MutableRefObject<string | null>;
    keyProvider: ProtonMeetKeyProvider;
    keyRotationScheduler: KeyRotationScheduler;
    isMeetSeamlessKeyRotationEnabled: boolean;
    isMeetClientMetricsLogEnabled: boolean;
    getAccessDetails: (params: GetAccessDetailsParams) => Promise<{ accessToken: string; websocketUrl: string }>;
    handleMlsSetup: UseMlsSessionResult['handleMlsSetup'];
    connectWithStunFallbackToTurnRelay: UseLiveKitConnectionResult['connectWithStunFallbackToTurnRelay'];
    cleanupMlsState: () => void;
    allowHealthCheck: () => void;
    disallowHealthCheck: () => void;
    initializeDevices: (timeout?: number) => Promise<void>;
    getParticipants: (token: string) => Promise<void>;
    reportMeetError: (msg: string, options?: unknown) => void;
    withMeetingLinkNameTag: (options?: unknown) => unknown;
    setJoinedRoom: Dispatch<SetStateAction<boolean>>;
    setMlsRetrying: Dispatch<SetStateAction<boolean>>;
    setIsReconnecting: Dispatch<SetStateAction<boolean>>;
    setReconnectionFailed: Dispatch<SetStateAction<boolean>>;
    triggerFullReconnectionRef: MutableRefObject<(reason: RejoinReasonInfo) => void>;
}

export interface UseReconnectionResult {
    isReconnectingRef: MutableRefObject<boolean>;
    websocketUrlRef: MutableRefObject<string | null>;
    performFullReconnection: (reason: RejoinReasonInfo) => Promise<void>;
}

export const useReconnection = ({
    wasmApp,
    room,
    meetingLinkNameRef,
    meetingPassword,
    displayName,
    decryptionKeyRef,
    mlsSetupDone,
    accessTokenRef,
    keyProvider,
    keyRotationScheduler,
    isMeetSeamlessKeyRotationEnabled,
    isMeetClientMetricsLogEnabled,
    getAccessDetails,
    handleMlsSetup,
    connectWithStunFallbackToTurnRelay,
    cleanupMlsState,
    allowHealthCheck,
    disallowHealthCheck,
    initializeDevices,
    getParticipants,
    reportMeetError,
    withMeetingLinkNameTag,
    setJoinedRoom,
    setMlsRetrying,
    setIsReconnecting,
    setReconnectionFailed,
    triggerFullReconnectionRef,
}: UseReconnectionParams): UseReconnectionResult => {
    const isReconnectingRef = useRef(false);
    const websocketUrlRef = useRef<string | null>(null);

    const performFullReconnection = useCallback(
        async (reason: RejoinReasonInfo) => {
            if (isReconnectingRef.current || !wasmApp || !meetingLinkNameRef.current) {
                return;
            }
            isReconnectingRef.current = true;
            const reconnectionStartTimeMs = BigInt(Date.now());

            setIsReconnecting(true);
            setReconnectionFailed(false);
            setMlsRetrying(false);
            disallowHealthCheck();

            const meetingToken = meetingLinkNameRef.current;

            try {
                // Snapshot before room.disconnect() — the Disconnected handler clears this ref synchronously
                const wasMlsActive = mlsSetupDone.current;

                try {
                    await room.disconnect();
                } catch {
                    // best effort
                }

                // Always await leaveMeeting when MLS was active. We do this here (not in the disconnect
                // handler) so it is properly awaited before joinMeetingWithAccessToken is called below.
                if (wasMlsActive) {
                    try {
                        await wasmApp.leaveMeeting();
                    } catch {
                        // best effort
                    }
                    mlsSetupDone.current = false;
                }

                cleanupMlsState();

                const sanitizedDisplayName = sanitizeMessage(displayName);
                const encryptedDisplayName = decryptionKeyRef.current
                    ? await encryptDisplayNameWithKey(decryptionKeyRef.current, sanitizedDisplayName)
                    : '';

                const newDetails = await getAccessDetails({
                    displayName: sanitizedDisplayName,
                    token: meetingToken,
                    encryptedDisplayName,
                });

                websocketUrlRef.current = newDetails.websocketUrl;
                accessTokenRef.current = newDetails.accessToken;
                const websocketUrl = newDetails.websocketUrl;
                const accessToken = newDetails.accessToken;

                // Reset MLS state for a fresh join attempt
                mlsSetupDone.current = false;

                const groupKeyData = await handleMlsSetup(meetingToken, accessToken, meetingPassword);
                if (!groupKeyData) {
                    throw new Error('MLS setup did not return key data');
                }

                // Mirror handleJoin: set the new key in keyProvider before enabling E2EE
                if (isMeetSeamlessKeyRotationEnabled) {
                    await keyRotationScheduler.schedule(groupKeyData.key, groupKeyData.epoch);
                } else {
                    await keyProvider.setKeyWithEpoch(groupKeyData.key, groupKeyData.epoch);
                }

                await room.setE2EEEnabled(true);
                await connectWithStunFallbackToTurnRelay(websocketUrl, accessToken, 20_000);

                // Restore meeting state
                meetingLinkNameRef.current = meetingToken;
                setJoinedRoom(true);
                await initializeDevices(5_000);
                await getParticipants(meetingToken);

                setIsReconnecting(false);
                isReconnectingRef.current = false;
                allowHealthCheck();

                if (isMeetClientMetricsLogEnabled) {
                    const rejoinTimeMs = BigInt(Date.now()) - reconnectionStartTimeMs;
                    await wasmApp
                        .logUserRejoin(rejoinTimeMs, 1, reason, true)
                        .catch((err: unknown) =>
                            reportMeetError('Failed to log reconnection success', withMeetingLinkNameTag(err))
                        );
                }
            } catch (error) {
                reportMeetError('Full reconnection failed', withMeetingLinkNameTag(error));

                // Best-effort MLS leave in case handleMlsSetup succeeded but a later step failed
                if (mlsSetupDone.current) {
                    try {
                        await wasmApp?.leaveMeeting();
                    } catch {
                        // best effort
                    }
                }
                cleanupMlsState();

                setIsReconnecting(false);
                isReconnectingRef.current = false;
                setReconnectionFailed(true);
                // Clear stored credentials so the next attempt (manual rejoin) fetches fresh ones
                accessTokenRef.current = null;
                websocketUrlRef.current = null;

                if (isMeetClientMetricsLogEnabled) {
                    const rejoinTimeMs = BigInt(Date.now()) - reconnectionStartTimeMs;
                    await wasmApp
                        ?.logUserRejoin(rejoinTimeMs, 1, reason, false)
                        .catch((err: unknown) =>
                            reportMeetError('Failed to log reconnection failure', withMeetingLinkNameTag(err))
                        );
                }
            }
        },
        [
            wasmApp,
            room,
            meetingPassword,
            displayName,
            getAccessDetails,
            handleMlsSetup,
            connectWithStunFallbackToTurnRelay,
            cleanupMlsState,
            allowHealthCheck,
            disallowHealthCheck,
            initializeDevices,
            getParticipants,
            isMeetSeamlessKeyRotationEnabled,
            isMeetClientMetricsLogEnabled,
            keyRotationScheduler,
            keyProvider,
            reportMeetError,
            withMeetingLinkNameTag,
            setJoinedRoom,
            setMlsRetrying,
            setIsReconnecting,
            setReconnectionFailed,
        ]
    );

    // Keep the stable ref in sync so callbacks registered before performFullReconnection was defined
    // (e.g. useConnectionHealthCheck's onMlsFailed) always call the latest version.
    useEffect(() => {
        triggerFullReconnectionRef.current = performFullReconnection;
    }, [performFullReconnection]);

    return {
        isReconnectingRef,
        websocketUrlRef,
        performFullReconnection,
    };
};
