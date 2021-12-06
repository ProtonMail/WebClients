import { ReactNode } from 'react';

import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import { Api } from '@proton/shared/lib/interfaces';
import { LinkMeta } from '@proton/shared/lib/interfaces/drive/link';

export interface DriveEvent {
    EventType: EVENT_TYPES;
    Data: any;
    Link: LinkMeta;
    createTime: number;
}

enum DriveEventsPaginationFlag {
    completed = 0,
    hasMore = 1,
}

export type DriveEventsPayload = {
    Events: DriveEvent[];
    EventID: string;
    More: DriveEventsPaginationFlag;
    Refresh: 0 | 1;
};

export type EventHandler = (eventsPayload: DriveEventsPayload, shareId: string) => any;

export type DriveEventManagerProviderProps = {
    api: Api;
    generalEventManager: EventManager;
    children: ReactNode;
};

type UnregisterEventHandler = (handlerId: string) => boolean;
type UnsubscribeFromShare = (shareId: string) => boolean;
type PauseShareSubscription = (shareId: string) => boolean;
type SubscribeToShare = (shareId: string) => Promise<boolean>;

export interface DriveEventManagerProviderCallbacks {
    clear: () => void;
    getSubscriptionIds: () => string[];
    pauseShareSubscription: PauseShareSubscription;
    pollAllDriveEvents: () => Promise<unknown[]>;
    pollAllShareEvents: (shareId: string) => Promise<[void, void]>;
    pollShare: (shareId: string) => Promise<void>;
    registerEventHandler: (handler: EventHandler) => string;
    registerEventHandlerById: (id: string, handler: EventHandler) => string;
    subscribeToShare: SubscribeToShare;
    unregisterEventHandler: UnregisterEventHandler;
    unsubscribeFromShare: UnsubscribeFromShare;
}
