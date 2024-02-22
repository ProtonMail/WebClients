import type { Action } from 'redux';
import { select, takeLatest } from 'redux-saga/effects';

import { generateCache } from '@proton/pass/lib/cache/generate';
import { clientBooted } from '@proton/pass/lib/client';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { cacheCancel, stateDestroy } from '@proton/pass/store/actions';
import { type WithCache, isCachingAction } from '@proton/pass/store/actions/enhancers/cache';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import type { EncryptedPassCache } from '@proton/pass/types/worker/cache';
import { or } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';

const CACHE_THROTTLING_TIMEOUT = 1_000;

function* cacheWorker({ meta, type }: WithCache<Action>, { getAppState, getAuthStore, setCache }: RootSagaOptions) {
    if (meta.throttle) yield wait(CACHE_THROTTLING_TIMEOUT);

    const authStore = getAuthStore();
    const loggedIn = authStore.hasSession();
    const keyPassword = authStore.getPassword() ?? '';
    const sessionLockToken = authStore.getLockToken();
    const offlineKD = authStore.getOfflineKD();

    const booted = clientBooted(getAppState().status);

    if (loggedIn && booted && PassCrypto.ready) {
        try {
            const state = (yield select()) as State;
            const cache: EncryptedPassCache = yield generateCache({ keyPassword, offlineKD, sessionLockToken })(state);
            yield setCache(cache);

            logger.info(`[Cache] Caching store and crypto state @ action["${type}"]`);
        } catch {}
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLatest(or(isCachingAction, cacheCancel.match, stateDestroy.match), function* (action) {
        if (isCachingAction(action)) yield cacheWorker(action, options);
        else logger.info(`[Cache] Invalidated all caching tasks`);
    });
}
