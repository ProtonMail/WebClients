import type { AnyAction, Middleware } from 'redux';

import { isCachingAction } from '@proton/pass/store/actions/with-cache';
import { sanitizeWithCallbackAction } from '@proton/pass/store/actions/with-callback';

import { authStore } from '../../lib/core';
import { ServiceWorkerClientID } from '../ServiceWorker/ServiceWorkerProvider';
import type { ServiceWorkerMessage, WithOrigin } from '../ServiceWorker/channel';

/** Broadcast any cache-triggering actions to other tabs via service
 * worker messaging. This allows syncing state accross tabs without
 * having to worry about race-conditions when writing cache to IDB */
export const cacheMiddleware: Middleware = () => (next) => (action: AnyAction) => {
    if (isCachingAction(action)) {
        const sanitized = sanitizeWithCallbackAction({ ...action });
        sanitized.meta.cache = false;
        sanitized.meta.immediate = false;

        const message: WithOrigin<ServiceWorkerMessage> = {
            action: sanitized,
            broadcast: true,
            localID: authStore.getLocalID(),
            origin: ServiceWorkerClientID,
            type: 'action',
        };

        navigator.serviceWorker.controller?.postMessage(message);
    }

    next(action);
};
