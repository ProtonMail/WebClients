import { put, takeLeading } from 'redux-saga/effects';

import { isPassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import { bootFailure, bootIntent, bootSuccess, stopEventPolling, syncLocalSettings } from '@proton/pass/store/actions';
import { SyncType, synchronize } from '@proton/pass/store/sagas/client/sync';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';

import { hydrateFromCache } from './hydrate.saga';

function* bootWorker(options: WorkerRootSagaOptions) {
    try {
        yield put(stopEventPolling());

        /* merge the existing cache to preserve any state that may have been
         * mutated before the boot sequence (session lock data) */
        const mergeCache = (existing: State, incoming: State) => merge(existing, incoming, { excludeEmpty: true });
        const hydratedFromCache: boolean = yield hydrateFromCache(mergeCache, options);

        /* Force sync the proxied settings from local storage */
        yield put(syncLocalSettings(yield options.getLocalSettings()));

        /* Allow failure during sync if we have a cached state,
         * worst case scenario: sync will happen on next event-loop  */
        yield put(bootSuccess(yield synchronize({ type: SyncType.PARTIAL, allowFailure: hydratedFromCache }, options)));

        options.onBoot?.({ ok: true });
    } catch (error: unknown) {
        logger.warn('[Saga::Boot]', error);
        yield put(bootFailure(error));
        options.onBoot?.({ ok: false, clearCache: isPassCryptoError(error) });
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(bootIntent.match, bootWorker, options);
}
