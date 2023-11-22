import type { AnyAction } from 'redux';

import { type RefreshSessionData } from '@proton/pass/lib/api/refresh';

export type ServiceWorkerMessageBase = {
    /**  set this flag when sending out messages from clients to
     * the service worker in order to broadcast the message back to
     * every claimed clients */
    broadcast?: boolean;
    localID?: number;
};

export type ServiceWorkerMessage = ServiceWorkerMessageBase &
    (
        | { type: 'ping' }
        | { type: 'unauthorized' }
        | { type: 'locked' }
        | { type: 'refresh'; data: RefreshSessionData }
        | { type: 'action'; action: AnyAction }
    );

export type WithOrigin<T> = T & {
    /** origin of the message, in the case of broadcasted messages
     *  this will be the original `ServiceWorkerClientID` */
    origin: string;
};

export type ServiceWorkerMessageType = ServiceWorkerMessage['type'];

export const CLIENT_CHANNEL = new BroadcastChannel('pass::clients');
