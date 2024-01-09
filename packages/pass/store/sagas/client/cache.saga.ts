import type { Action, AnyAction } from 'redux';
import { fork, race, select, take, takeLatest } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { CACHE_SALT_LENGTH, getCacheEncryptionKey } from '@proton/pass/lib/crypto/utils/cache.encrypt';
import { encryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { cacheCancel } from '@proton/pass/store/actions';
import { type WithCache, isCachingAction } from '@proton/pass/store/actions/with-cache';
import { asIfNotOptimistic } from '@proton/pass/store/optimistic/selectors/select-is-optimistic';
import { reducerMap } from '@proton/pass/store/reducers';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import { AppStatus, PassEncryptionTag } from '@proton/pass/types';
import { oneOf } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { objectFilter } from '@proton/pass/utils/object/filter';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import { wait } from '@proton/shared/lib/helpers/promise';

const CACHE_THROTTLING_TIMEOUT = 1_000;

function* cacheWorker({ meta, type }: WithCache<AnyAction>, { getAppState, getAuthStore, setCache }: RootSagaOptions) {
    if (meta.throttle) yield wait(CACHE_THROTTLING_TIMEOUT);

    const loggedIn = getAuthStore().hasSession();
    const booted = oneOf(AppStatus.READY, AppStatus.BOOTING)(getAppState().status);

    if (loggedIn && booted && PassCrypto.ready) {
        try {
            const sessionLockToken = getAuthStore().getLockToken();
            const cacheSalt = crypto.getRandomValues(new Uint8Array(CACHE_SALT_LENGTH));
            const key: CryptoKey = yield getCacheEncryptionKey(cacheSalt, sessionLockToken);

            const state = (yield select()) as State;
            const whiteListedState = asIfNotOptimistic(state, reducerMap);

            /* keep non-expired request metadata */
            whiteListedState.request = objectFilter(
                whiteListedState.request,
                (_, request) => request.status === 'success' && request.expiresAt !== undefined
            );

            const encoder = new TextEncoder();
            const stringifiedState = JSON.stringify(whiteListedState);
            const encryptedData: Uint8Array = yield encryptData(
                key,
                encoder.encode(stringifiedState),
                PassEncryptionTag.Cache
            );

            const workerSnapshot = PassCrypto.serialize();
            const stringifiedSnapshot = JSON.stringify(workerSnapshot);

            const encryptedWorkerSnapshot: Uint8Array = yield encryptData(
                key,
                stringToUint8Array(stringifiedSnapshot),
                PassEncryptionTag.Cache
            );

            yield setCache({
                salt: uint8ArrayToString(cacheSalt),
                state: uint8ArrayToString(encryptedData),
                snapshot: uint8ArrayToString(encryptedWorkerSnapshot),
            });

            logger.info(`[Cache] Caching store and crypto state @ action["${type}"]`);
        } catch {}
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLatest(isCachingAction, function* (action) {
        const result = (yield race({
            cache: fork(cacheWorker, action, options),
            cancel: take(cacheCancel.match),
        })) as { cancel?: Action };

        if (result.cancel) logger.info(`[Cache] Invalidated all caching tasks`);
    });
}
