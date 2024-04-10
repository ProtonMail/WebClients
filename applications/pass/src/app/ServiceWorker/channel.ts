import type { Action } from 'redux';

import type { RefreshSessionData } from '@proton/pass/lib/api/refresh';
import type { LockMode } from '@proton/pass/lib/auth/lock/types';

export type ServiceWorkerMessageBase = {
    /**  set this flag when sending out messages from clients to
     * the service worker in order to broadcast the message back to
     * every claimed clients */
    broadcast?: boolean;
    localID?: number;
};

export type ServiceWorkerMessage = ServiceWorkerMessageBase &
    (
        | { type: 'abort'; requestId: string }
        | { type: 'action'; action: Action }
        | { type: 'claim' }
        | { type: 'lock_deleted'; mode: LockMode }
        | { type: 'locked'; mode: LockMode }
        | { type: 'ping' }
        | { type: 'refresh'; data: RefreshSessionData }
        | { type: 'unauthorized' }
    );

export type ServiceWorkerMessageType = ServiceWorkerMessage['type'];
export type ServiceWorkerMessageResponseMap = {};

export type ServiceWorkerResponse<MessageType extends ServiceWorkerMessageType> =
    MessageType extends keyof ServiceWorkerMessageResponseMap ? ServiceWorkerMessageResponseMap[MessageType] : boolean;

export type WithOrigin<T> = T & {
    /** origin of the message, in the case of broadcasted messages
     *  this will be the original `ServiceWorkerClientID` */
    origin: string;
};

export const CLIENT_CHANNEL = new BroadcastChannel('pass::clients');
