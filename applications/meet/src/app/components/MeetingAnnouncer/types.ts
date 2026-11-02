import type { ConnectionState } from 'livekit-client';

/** Connection info lives as React state in `ProtonMeetContainer`, not Redux, so it is passed in. */
export interface ConnectionAnnouncementState {
    isReconnecting: boolean;
    mlsRetrying: boolean;
    isDisconnected: boolean;
    liveKitConnectionState: ConnectionState | null;
    showReconnectedMessage: boolean;
}
