import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';

import { EncryptedLink } from '../links';

export type EventHandler = (shareId: string, events: DriveEvents) => Promise<void> | void;

export interface DriveEvents {
    eventId: string;
    events: DriveEvent[];
    refresh: boolean;
}

export interface DriveEvent {
    eventType: EVENT_TYPES;
    encryptedLink: EncryptedLink;
}
