import { put, select, takeLatest } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { decryptCachedState } from '@proton/pass/lib/crypto/utils/cache.decrypt';
import { PassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import { getUserState } from '@proton/pass/lib/user/user.requests';
import {
    cacheCancel,
    cacheRequest,
    getUserAccessSuccess,
    getUserFeaturesSuccess,
    startEventPolling,
    stateHydrate,
    stateSync,
    stopEventPolling,
} from '@proton/pass/store/actions';
import type { SafeUserState } from '@proton/pass/store/reducers';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import type { EncryptedPassCache, PassCache } from '@proton/pass/types/worker/cache';
import { pick } from '@proton/shared/lib/helpers/object';
import { wait } from '@proton/shared/lib/helpers/promise';

import { userAccessRequest, userFeaturesRequest } from '../../actions/requests';

/** Requests all user state from the API and updates the
 * relevant request metadata for caching purposes */
function* resolveUserState(userId: string) {
    const userState: SafeUserState = yield getUserState();
    yield put(getUserAccessSuccess(userAccessRequest(userId), pick(userState, ['waitingNewUserInvites', 'plan'])));
    yield put(getUserFeaturesSuccess(userFeaturesRequest(userId), userState.features));

    return userState;
}

/** Will try to decrypt the store cache and hydrate the store accordingly. Returns a
 * boolean flag indicating wether hydration happened from cache or not. */
export function* hydrateFromCache(
    /** define how we should merge the incoming state */
    merge: (existing: State, incoming: State) => State,
    { getCache, getAuthStore }: RootSagaOptions
) {
    const currentState: State = yield select();

    const authStore = getAuthStore();
    const keyPassword = authStore.getPassword();
    const userID = authStore.getUserID()!;
    const sessionLockToken = authStore.getLockToken();

    const encryptedCache: Partial<EncryptedPassCache> = yield getCache();
    const cache: Maybe<PassCache> = yield decryptCachedState(encryptedCache, sessionLockToken);

    const failure = (encryptedCache.state && !cache?.state) || (encryptedCache.snapshot && !cache?.snapshot);
    if (failure) throw new PassCryptoError();

    const userState: SafeUserState = cache?.state.user ?? (yield resolveUserState(userID));

    const state: State = { ...(cache?.state ? merge(currentState, cache.state) : currentState), user: userState };
    const user = userState.user;
    const addresses = Object.values(userState.addresses);

    yield PassCrypto.hydrate({ user, keyPassword, addresses, snapshot: cache?.snapshot });
    yield put(stateHydrate(state));

    return cache?.state !== undefined && cache?.snapshot !== undefined;
}

function* hydrateWorker(options: RootSagaOptions) {
    try {
        yield put(stopEventPolling());
        yield put(cacheCancel());

        /* Throttle the cache hydration in case multiple
         * requests are made concurrently, e.g., when
         * the user is rapidly switching tabs. Ideally, we should
         * implement a real caching mutex via the service worker
         * to avoid this and the error handling below. */
        yield wait(500);

        yield hydrateFromCache((_, incoming) => incoming, options);
        yield put(startEventPolling());
    } catch {
        /** If hydrating from cache failed : encryption scheme may
         * have changed, as such trigger a cache request immediately */
        yield put(cacheRequest({ throttle: false }));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLatest(stateSync.match, hydrateWorker, options);
}
