import {
    ServiceWorkerClientID,
    ServiceWorkerEnabled,
} from 'proton-pass-web/app/ServiceWorker/client/ServiceWorkerProvider';
import type { ServiceWorkerMessage, WithOrigin } from 'proton-pass-web/app/ServiceWorker/types';
import { type Middleware, isAction } from 'redux';

import { authStore } from '@proton/pass/lib/auth/store';
import { isCachingAction } from '@proton/pass/store/actions/enhancers/cache';
import { sanitizeWithCallbackAction } from '@proton/pass/store/actions/enhancers/callback';
import type { State } from '@proton/pass/store/types';

/** Broadcast any cache-triggering actions to other tabs via service
 * worker messaging. This allows syncing state accross tabs without
 * having to worry about race-conditions when writing cache to IDB */
export const cacheMiddleware: Middleware<{}, State> = () => (next) => (action: unknown) => {
    if (isAction(action) && isCachingAction(action)) {
        const sanitized = sanitizeWithCallbackAction({ ...action });
        sanitized.meta.cache = false;

        const message: WithOrigin<ServiceWorkerMessage> = {
            action: sanitized,
            broadcast: true,
            localID: authStore.getLocalID(),
            origin: ServiceWorkerClientID,
            type: 'action',
        };

        if (ServiceWorkerEnabled) navigator.serviceWorker.controller?.postMessage(message);
    }

    next(action);
};
