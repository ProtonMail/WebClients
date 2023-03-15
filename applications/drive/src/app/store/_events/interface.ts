import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';

import { EncryptedLink } from '../_links';

export type EventHandler = (volumeId: string, events: DriveEvents) => Promise<void> | void;

export interface DriveEvents {
    eventId: string;
    events: DriveEvent[];
    refresh: boolean;
}

export type DriveEvent = {
    eventType: EVENT_TYPES;
    encryptedLink: EncryptedLink;
    originShareId?: string;
};
