import { useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Room } from 'livekit-client';
import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectCameraPermission,
    selectMicrophonePermission,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { isFirefox } from '@proton/shared/lib/helpers/browser';

import { checkIfUsingTurnRelay } from '../utils/checkIfUsingTurnRelay';
import { isConnectionTimeoutError } from '../utils/connectionErrors';

const isConnectionError = (error: any): boolean => {
    const msg = error?.message || '';
    return msg.includes('could not establish signal connection');
};

// Thrown post-signaling when the PeerConnection fails to reach `connected` (ICE FAILED).
const isPeerConnectionError = (error: any): boolean => {
    const msg = error?.message || '';
    return msg.includes('could not establish pc connection');
};

// Connection failures worth retrying over a different transport policy.
const isRecoverableConnectionError = (error: any): boolean =>
    isConnectionError(error) || isConnectionTimeoutError(error) || isPeerConnectionError(error);

export type ConnectionInfo = { stunFailed: boolean; connectionAttempts: number };

interface UseLiveKitConnectionParams {
    reportMeetError: (msg: string, options?: unknown) => void;
}

export interface UseLiveKitConnectionResult {
    connectWithStunFallbackToTurnRelay: (url: string, token: string, timeout: number) => Promise<ConnectionInfo>;
    isUsingTurnRelay: boolean;
    joiningLoaderHeader: string | undefined;
    joiningLoaderSubtitle: string | undefined;
    clearLoaderState: () => void;
}

export const useLiveKitConnection = ({ reportMeetError }: UseLiveKitConnectionParams): UseLiveKitConnectionResult => {
    const room = useRoomContext();

    const [isUsingTurnRelay, setIsUsingTurnRelay] = useState(false);
    const [joiningLoaderHeader, setJoiningLoaderHeader] = useState<string | undefined>(undefined);
    const [joiningLoaderSubtitle, setJoiningLoaderSubtitle] = useState<string | undefined>(undefined);

    const cameraPermission = useMeetSelector(selectCameraPermission);
    const microphonePermission = useMeetSelector(selectMicrophonePermission);

    const connectWithTimeout = async (
        url: string,
        token: string,
        timeout: number,
        options: Parameters<Room['connect']>[2],
        warningHeader?: string,
        warningSubtitle?: string
    ): Promise<void> => {
        const connectPromise = room.connect(url, token, options);

        let warningShown = false;
        const warningTime = Math.floor(timeout / 2);

        const warningTimer = setTimeout(() => {
            if (!warningShown) {
                warningShown = true;
                if (warningHeader) {
                    setJoiningLoaderHeader(warningHeader);
                }
                if (warningSubtitle) {
                    setJoiningLoaderSubtitle(warningSubtitle);
                }
                reportMeetError(`Livekit room connection time abnormal (${warningTime}ms)`, {
                    context: {
                        timeout: `${warningTime}ms`,
                        stage: 'warning',
                    },
                });
            }
        }, warningTime);

        let timeoutTimer: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutTimer = setTimeout(async () => {
                reportMeetError(`Livekit room connection timeout (${timeout}ms)`, {
                    context: {
                        timeout: `${timeout}ms`,
                        stage: 'failed',
                    },
                });
                reject(new Error(`Connection timeout after ${timeout}ms`));
            }, timeout);
        });

        try {
            await Promise.race([connectPromise, timeoutPromise]);
        } finally {
            clearTimeout(warningTimer);
            if (timeoutTimer) {
                clearTimeout(timeoutTimer);
            }
        }
    };

    const connectViaTurnRelay = async (url: string, token: string, timeout: number): Promise<void> => {
        try {
            await connectWithTimeout(url, token, timeout, {
                autoSubscribe: false,
                rtcConfig: { iceTransportPolicy: 'relay' },
                peerConnectionTimeout: timeout / 2,
            });
        } catch (error) {
            if (isConnectionTimeoutError(error)) {
                await room.disconnect();
            }
            throw error;
        }
    };

    const connectDirect = async (url: string, token: string, timeout: number): Promise<void> => {
        await connectWithTimeout(
            url,
            token,
            timeout,
            { autoSubscribe: false, peerConnectionTimeout: timeout / 2 },
            c('Warning').t`Connection is taking longer than expected`,
            c('Warning').t`Trying another route…`
        );
    };

    const connectWithStunFallbackToTurnRelay = async (
        url: string,
        token: string,
        timeout: number
    ): Promise<ConnectionInfo> => {
        const noMediaPermission = cameraPermission !== 'granted' && microphonePermission !== 'granted';

        // Firefox can't gather host/srflx candidates without media permission, so force
        // TURN relay first and fall back to a direct attempt if the relay fails.
        if (isFirefox() && noMediaPermission) {
            try {
                await connectViaTurnRelay(url, token, timeout);
                setIsUsingTurnRelay(true);
                return { stunFailed: false, connectionAttempts: 1 };
            } catch (relayError: any) {
                if (!isRecoverableConnectionError(relayError)) {
                    throw relayError;
                }

                reportMeetError(
                    'Forced TURN relay failed on Firefox without media permission, trying direct connection',
                    { context: { error: relayError } }
                );
                setJoiningLoaderHeader(c('Warning').t`Connection is taking longer than expected`);
                setJoiningLoaderSubtitle(c('Warning').t`Trying another route…`);

                await connectDirect(url, token, timeout);
                setIsUsingTurnRelay(await checkIfUsingTurnRelay(room));
                return { stunFailed: true, connectionAttempts: 2 };
            }
        }

        try {
            await connectDirect(url, token, timeout);
            setIsUsingTurnRelay(await checkIfUsingTurnRelay(room));
            return { stunFailed: false, connectionAttempts: 1 };
        } catch (roomConnectionError: any) {
            if (!isRecoverableConnectionError(roomConnectionError)) {
                throw roomConnectionError;
            }

            const isTimeout = isConnectionTimeoutError(roomConnectionError);
            reportMeetError(`STUN UDP connection ${isTimeout ? 'timeout' : 'failed'}, trying with TURN relay`, {
                context: { error: roomConnectionError },
            });
            setJoiningLoaderHeader(c('Warning').t`Connection is taking longer than expected`);
            setJoiningLoaderSubtitle(
                isTimeout
                    ? c('Warning').t`STUN UDP connection timeout, trying with TURN relay`
                    : c('Warning').t`STUN UDP connection failed, trying with TURN relay…`
            );

            if (isTimeout) {
                await room.disconnect();
            }

            await connectViaTurnRelay(url, token, timeout);
            setIsUsingTurnRelay(true);
            return { stunFailed: true, connectionAttempts: 2 };
        }
    };

    const clearLoaderState = () => {
        setJoiningLoaderHeader(undefined);
        setJoiningLoaderSubtitle(undefined);
    };

    return {
        connectWithStunFallbackToTurnRelay,
        isUsingTurnRelay,
        joiningLoaderHeader,
        joiningLoaderSubtitle,
        clearLoaderState,
    };
};
