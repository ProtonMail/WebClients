import type { EVENT_TYPES } from '@proton/shared/lib/drive/constants';

import type { EncryptedLink } from '../_links';

export type EventHandler = (
    volumeId: string,
    events: DriveEvents,
    processedEventCounter: (eventId: string, event: DriveEvent) => void
) => Promise<void> | void;

export interface DriveEvents {
    eventId: string;
    events: DriveEvent[];
    refresh: boolean;
}

export type DriveEvent = {
    eventType: EVENT_TYPES;
    encryptedLink: EncryptedLink;
    data?: DriveEventData;
    originShareId?: string;
};

export type DriveEventData = {
    externalInvitationSignup?: string;
};
