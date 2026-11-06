import { ConnectionState } from 'livekit-client';

type ConnectionBanner = 'fullReconnect' | 'mlsRetrying' | 'liveKit' | 'meetingServerReconnecting';

interface ConnectionBannerState {
    isReconnecting: boolean;
    mlsRetrying: boolean;
    isDisconnected: boolean;
    liveKitConnectionState: ConnectionState | null;
    showReconnectedMessage: boolean;
    isWebsocketReconnecting: boolean;
}

export const getConnectionBanner = ({
    isReconnecting,
    mlsRetrying,
    isDisconnected,
    liveKitConnectionState,
    showReconnectedMessage,
    isWebsocketReconnecting,
}: ConnectionBannerState): ConnectionBanner | null => {
    if (isReconnecting) {
        return 'fullReconnect';
    }
    if (mlsRetrying) {
        return 'mlsRetrying';
    }
    if (isDisconnected) {
        return null;
    }
    if (
        liveKitConnectionState === ConnectionState.SignalReconnecting ||
        liveKitConnectionState === ConnectionState.Reconnecting ||
        showReconnectedMessage
    ) {
        return 'liveKit';
    }
    if (isWebsocketReconnecting) {
        return 'meetingServerReconnecting';
    }
    return null;
};
