import type { ConnectionState } from 'livekit-client';

export interface AnnounceOptions {
    /** Announcements sharing a key within the de-dup window are dropped. Defaults to the text. */
    dedupeKey?: string;
    priority?: number;
}

export enum AnnouncementPriority {
    Low = 0,
    Normal = 1,
    High = 2,
}

export type AnnounceFn = (message: string, options?: AnnounceOptions) => void;

/** Connection info lives as React state in `ProtonMeetContainer`, not Redux, so it is passed in. */
export interface ConnectionAnnouncementState {
    isReconnecting: boolean;
    mlsRetrying: boolean;
    isDisconnected: boolean;
    liveKitConnectionState: ConnectionState | null;
    showReconnectedMessage: boolean;
}
