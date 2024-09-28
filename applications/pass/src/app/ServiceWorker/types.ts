import type { Action } from 'redux';

import type { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { AuthSession } from '@proton/pass/lib/auth/session';
import type { SwitchableSession } from '@proton/pass/lib/auth/switch';
import type { MaybePromise } from '@proton/pass/types';

export type ServiceWorkerMessageBase = {
    /** set this flag when sending out messages from clients to
     * the service worker in order to broadcast the message back to
     * every claimed clients */
    broadcast?: boolean;
    localID?: number;
};

export type ServiceWorkerMessage = ServiceWorkerMessageBase &
    (
        | { type: 'abort'; requestId: string }
        | { type: 'action'; action: Action }
        | { type: 'check'; hash: string }
        | { type: 'claim' }
        | { type: 'connect' }
        | { type: 'fork'; userID: string }
        | { type: 'lock_deleted'; mode: LockMode }
        | { type: 'locked'; mode: LockMode }
        | { type: 'session'; data: Partial<AuthSession> }
        | { type: 'sessions_synced'; data: SwitchableSession[] }
        | { type: 'unauthorized' }
    );

export type WithOrigin<T> = T & {
    /** origin of the message, in the case of broadcasted messages
     *  this will be the original `ServiceWorkerClientID` */
    origin: string;
};

export type ServiceWorkerMessageType = ServiceWorkerMessage['type'];
export type ServiceWorkerMessageResponseMap = {};

export type ServiceWorkerResponse<T extends ServiceWorkerMessageType> = T extends keyof ServiceWorkerMessageResponseMap
    ? ServiceWorkerMessageResponseMap[T]
    : void;

export type ServiceWorkerMessageHandler<
    T extends ServiceWorkerMessageType = ServiceWorkerMessageType,
    R = ServiceWorkerResponse<T>,
> = (message: Extract<ServiceWorkerMessage, { type: T }>) => MaybePromise<R>;
