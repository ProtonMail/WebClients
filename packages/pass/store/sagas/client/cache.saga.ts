import type { Action } from 'redux';
import { select, takeLatest } from 'redux-saga/effects';

import { wait } from '@proton/shared/lib/helpers/promise';

import { generateCache } from '../../../lib/cache/generate';
import { PassCrypto } from '../../../lib/crypto';
import type { EncryptedPassCache } from '../../../types/worker/cache';
import { or } from '../../../utils/fp/predicates';
import { logger } from '../../../utils/logger';
import { cacheCancel, stateDestroy } from '../../actions';
import { type WithCache, isCachingAction } from '../../actions/enhancers/cache';
import type { RootSagaOptions, State } from '../../types';

const CACHE_THROTTLING_TIMEOUT = 1_000;

export function* cacheWorker({ meta, type }: WithCache<Action>, { getAppState, getAuthStore, setCache }: RootSagaOptions) {
    if (meta.throttle) yield wait(CACHE_THROTTLING_TIMEOUT);

    const { booted, authorized } = getAppState();
    const authStore = getAuthStore();
    const keyPassword = authStore.getPassword();
    const validSession = authStore.hasSession() && keyPassword !== undefined;
    const sessionLockToken = authStore.getLockToken();
    const offlineKD = authStore.getOfflineKD();
    const ready = booted && authorized;

    if (validSession && ready && PassCrypto.ready) {
        try {
            const state: State = yield select();
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
