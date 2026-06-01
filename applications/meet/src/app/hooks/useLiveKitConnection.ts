import { useState } from 'react';

import type { Room } from 'livekit-client';
import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectCameraPermission,
    selectMicrophonePermission,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { isFirefox } from '@proton/shared/lib/helpers/browser';

import { checkIfUsingTurnRelay } from '../utils/checkIfUsingTurnRelay';

const isConnectionError = (error: any): boolean => {
    const msg = error?.message || '';
    return msg.includes('could not establish signal connection');
};

export const isConnectionTimeoutError = (error: any): boolean => {
    const msg = error?.message || '';
    return msg.includes('Connection timeout after');
};

export type ConnectionInfo = { stunFailed: boolean; connectionAttempts: number };

interface UseLiveKitConnectionParams {
    room: Room;
    reportMeetError: (msg: string, options?: unknown) => void;
    withMeetingLinkNameTag: (options?: unknown) => unknown;
}

export interface UseLiveKitConnectionResult {
    connectWithStunFallbackToTurnRelay: (url: string, token: string, timeout: number) => Promise<ConnectionInfo>;
    isUsingTurnRelay: boolean;
    joiningLoaderHeader: string | undefined;
    joiningLoaderSubtitle: string | undefined;
    clearLoaderState: () => void;
}

export const useLiveKitConnection = ({
    room,
    reportMeetError,
    withMeetingLinkNameTag,
}: UseLiveKitConnectionParams): UseLiveKitConnectionResult => {
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
                reportMeetError(
                    `Livekit room connection time abnormal (${warningTime}ms)`,
                    withMeetingLinkNameTag({
                        timeout: `${warningTime}ms`,
                        stage: 'warning',
                    })
                );
            }
        }, warningTime);

        let timeoutTimer: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutTimer = setTimeout(async () => {
                reportMeetError(
                    `Livekit room connection timeout (${timeout}ms)`,
                    withMeetingLinkNameTag({
                        timeout: `${timeout}ms`,
                        stage: 'failed',
                    })
                );
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

    const connectWithStunFallbackToTurnRelay = async (
        url: string,
        token: string,
        timeout: number
    ): Promise<ConnectionInfo> => {
        const noMediaPermission = cameraPermission !== 'granted' && microphonePermission !== 'granted';
        if (isFirefox() && noMediaPermission) {
            await connectViaTurnRelay(url, token, timeout);
            setIsUsingTurnRelay(true);
            return { stunFailed: false, connectionAttempts: 1 };
        }

        try {
            await connectWithTimeout(
                url,
                token,
                timeout,
                { autoSubscribe: false, peerConnectionTimeout: timeout / 2 },
                c('Warning').t`Connection is taking longer than expected`,
                c('Warning').t`Trying another route…`
            );
            setIsUsingTurnRelay(await checkIfUsingTurnRelay(room));
            return { stunFailed: false, connectionAttempts: 1 };
        } catch (roomConnectionError: any) {
            if (!isConnectionError(roomConnectionError) && !isConnectionTimeoutError(roomConnectionError)) {
                throw roomConnectionError;
            }

            const isTimeout = isConnectionTimeoutError(roomConnectionError);
            reportMeetError(
                `STUN UDP connection ${isTimeout ? 'timeout' : 'failed'}, trying with TURN relay`,
                withMeetingLinkNameTag(roomConnectionError)
            );
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
