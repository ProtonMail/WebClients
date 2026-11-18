import { ConnectionState } from 'livekit-client';

export type ReconnectingCause = 'fullRejoin' | 'encryptionRetry' | 'liveKitReconnect' | 'meetingServer';

interface ReconnectingCauseState {
    isReconnecting: boolean;
    mlsRetrying: boolean;
    isDisconnected: boolean;
    liveKitConnectionState: ConnectionState | null;
    isWebsocketReconnecting: boolean;
}

export const getReconnectingCause = ({
    isReconnecting,
    mlsRetrying,
    isDisconnected,
    liveKitConnectionState,
    isWebsocketReconnecting,
}: ReconnectingCauseState): ReconnectingCause | null => {
    if (isReconnecting) {
        return 'fullRejoin';
    }
    if (mlsRetrying) {
        return 'encryptionRetry';
    }
    if (isDisconnected) {
        return null;
    }
    if (
        liveKitConnectionState === ConnectionState.SignalReconnecting ||
        liveKitConnectionState === ConnectionState.Reconnecting
    ) {
        return 'liveKitReconnect';
    }
    if (isWebsocketReconnecting) {
        return 'meetingServer';
    }
    return null;
};
