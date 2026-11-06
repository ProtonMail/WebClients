import type { ConnectionState } from 'livekit-client';

export interface ConnectionAnnouncementState {
    isReconnecting: boolean;
    mlsRetrying: boolean;
    isDisconnected: boolean;
    liveKitConnectionState: ConnectionState | null;
    showReconnectedMessage: boolean;
    isWebsocketReconnecting: boolean;
}
