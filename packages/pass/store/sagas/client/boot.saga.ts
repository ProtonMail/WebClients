import type { Action } from 'redux';
import { put, race, take, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { isPassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import {
    bootFailure,
    bootIntent,
    bootSuccess,
    cacheRequest,
    stateDestroy,
    stopEventPolling,
    syncLocalSettings,
} from '@proton/pass/store/actions';
import { isCachingAction } from '@proton/pass/store/actions/enhancers/cache';
import { SyncType, synchronize } from '@proton/pass/store/sagas/client/sync';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';

import { hydrate } from './hydrate.saga';

function* bootWorker(options: RootSagaOptions) {
    try {
        yield put(stopEventPolling());
        yield loadCryptoWorker();
        /* merge the existing cache to preserve any state that may have been
         * mutated before the boot sequence (session lock data) */
        const mergeCache = (existing: State, incoming: State) => merge(existing, incoming, { excludeEmpty: true });
        const hydratedFromCache: boolean = yield hydrate({ allowFailure: true, merge: mergeCache }, options);

        /* Force sync the proxied settings from local storage */
        yield put(syncLocalSettings(yield options.getSettings()));
        yield put(bootSuccess(hydratedFromCache ? undefined : yield synchronize(SyncType.FULL)));

        options.onBoot?.({ ok: true });
    } catch (error: unknown) {
        logger.warn('[Saga::Boot]', error);
        yield put(bootFailure(error));
        options.onBoot?.({ ok: false, clearCache: isPassCryptoError(error) });
    }
}

/** If during the boot sequence we detect a state destruction
 * or a caching request : cancel the booting task. This can happen
 * when stressing the app on multiple tabs */
export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(bootIntent.match, function* () {
        const { caching, destroyed } = (yield race({
            start: bootWorker(options),
            caching: take(isCachingAction),
            destroyed: take(stateDestroy.match),
        })) as { caching?: Action; destroyed?: Action };

        if (caching || destroyed) {
            logger.warn(`[Saga::Boot] boot cancelled [caching=${Boolean(caching)}, destroyed=${Boolean(destroyed)}]`);
            yield put(bootFailure(new Error(c('Action').t`Sign back in`)));
            options.onBoot?.({ ok: false, clearCache: false });
        } else yield put(cacheRequest({ throttle: true }));
    });
}
