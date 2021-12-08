import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';

import { EncryptedLink } from '../links';

export type EventHandler = (shareId: string, events: DriveEvents) => void;

export interface DriveEvents {
    events: DriveEvent[];
    refresh: boolean;
}

interface DriveEvent {
    eventType: EVENT_TYPES;
    encryptedLink: EncryptedLink;
}
