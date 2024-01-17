import { put, select, takeLatest } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { decryptCachedState } from '@proton/pass/lib/crypto/utils/cache.decrypt';
import { getUserState } from '@proton/pass/lib/user/user.requests';
import {
    cacheCancel,
    cacheRequest,
    startEventPolling,
    stateHydrate,
    stateSync,
    stopEventPolling,
} from '@proton/pass/store/actions';
import type { SafeUserState } from '@proton/pass/store/reducers';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import type { EncryptedPassCache, PassCache } from '@proton/pass/types/worker/cache';
import { wait } from '@proton/shared/lib/helpers/promise';

type HydrateCacheOptions = {
    merge: (existing: State, incoming: State) => State;
    onError?: () => Generator;
};
/** Will try to decrypt the store cache and hydrate the store accordingly. Returns a
 * boolean flag indicating wether hydration happened from cache or not. */
export function* hydrateFromCache(
    /** define how we should merge the incoming state */
    { merge, onError }: HydrateCacheOptions,
    { getCache, getAuthStore }: RootSagaOptions
) {
    const currentState: State = yield select();

    const authStore = getAuthStore();
    const keyPassword = authStore.getPassword();
    const sessionLockToken = authStore.getLockToken();

    const encryptedCache: Partial<EncryptedPassCache> = yield getCache();
    const cache: Maybe<PassCache> = yield decryptCachedState(encryptedCache, sessionLockToken);

    const decryptionFailure = (encryptedCache.state && !cache?.state) || (encryptedCache.snapshot && !cache?.snapshot);

    if (decryptionFailure && onError) {
        yield onError();
        return false;
    }

    const userState: SafeUserState = cache?.state.user ?? (yield getUserState());

    const state: State = { ...(cache?.state ? merge(currentState, cache.state) : currentState), user: userState };
    const user = userState.user;
    const addresses = Object.values(userState.addresses);

    yield PassCrypto.hydrate({ user, keyPassword, addresses, snapshot: cache?.snapshot });
    yield put(stateHydrate(state));

    return cache?.state !== undefined && cache?.snapshot !== undefined;
}

function* hydrateWorker(options: RootSagaOptions) {
    yield put(stopEventPolling());
    yield put(cacheCancel());

    /* Throttle the cache hydration in case multiple
     * requests are made concurrently, e.g., when
     * the user is rapidly switching tabs. Ideally, we should
     * implement a real caching mutex via the service worker
     * to avoid this and the error handling below. */
    yield wait(500);

    yield hydrateFromCache(
        {
            merge: (_, incoming) => incoming,
            onError: function* onError() {
                /** If hydrating from cache failed during a state sync : encryption
                 * scheme may have changed, as such trigger a cache request immediately */
                yield put(cacheRequest({ throttle: false }));
            },
        },
        options
    );
    yield put(startEventPolling());
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLatest(stateSync.match, hydrateWorker, options);
}
