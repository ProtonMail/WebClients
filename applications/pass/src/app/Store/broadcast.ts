import cloneDeep from 'lodash/cloneDeep';
import { ServiceWorkerClientID, ServiceWorkerEnabled } from 'proton-pass-web/app/ServiceWorker/client/constants';
import type { ServiceWorkerMessage, WithOrigin } from 'proton-pass-web/app/ServiceWorker/types';
import type { Action } from 'redux';
import { type Middleware, isAction } from 'redux';

import { authStore } from '@proton/pass/lib/auth/store';
import { clientBooted } from '@proton/pass/lib/client';
import { cacheConflict } from '@proton/pass/store/actions';
import { isCachingAction } from '@proton/pass/store/actions/enhancers/cache';
import type { State } from '@proton/pass/store/types';
import { AppStatus, type Maybe } from '@proton/pass/types';

/** Resolves how a tab handles a cache-triggering action broadcast from another tab:
 * - booted → apply it (event-source the mutation)
 * - booting → its in-flight hydration is now stale, so signal a `cacheConflict` to restart it
 * - otherwise → ignore: the next boot re-hydrates the latest cache from IDB anyway. */
export const resolveBroadcast = (status: AppStatus, action: Action): Maybe<Action> => {
    if (clientBooted(status)) return action;
    if (status === AppStatus.BOOTING) return cacheConflict();
    return undefined;
};

/** Broadcast any cache-triggering actions to other tabs via service
 * worker messaging. This allows syncing state across tabs without
 * having to worry about race-conditions when writing cache to IDB */
export const broadcastMiddleware: Middleware<{}, State> = () => (next) => (action: unknown) => {
    if (ServiceWorkerEnabled && isAction(action) && isCachingAction(action)) {
        const sanitized = cloneDeep(action);
        sanitized.meta.cache = false;

        const message: WithOrigin<ServiceWorkerMessage> = {
            action: sanitized,
            broadcast: true,
            localID: authStore.getLocalID(),
            origin: ServiceWorkerClientID,
            type: 'action',
        };

        navigator.serviceWorker.controller?.postMessage(message);
    }

    return next(action);
};
