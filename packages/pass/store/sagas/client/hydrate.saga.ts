import { put, select, takeLeading } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { decryptCachedState } from '@proton/pass/lib/crypto/utils/cache.decrypt';
import { getUserState } from '@proton/pass/lib/user/user.requests';
import {
    getUserAccessSuccess,
    getUserFeaturesSuccess,
    startEventPolling,
    stateHydrate,
    stateSync,
    stopEventPolling,
} from '@proton/pass/store/actions';
import type { SafeUserState } from '@proton/pass/store/reducers';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import type { EncryptedPassCache, PassCache } from '@proton/pass/types/worker/cache';
import { pick } from '@proton/shared/lib/helpers/object';

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
 * boolean flag indicating wether the cache was hydrated from cache or not. */
export function* hydrateFromCache(
    /** define how we should merge the incoming state */
    merge: (existing: State, incoming: State) => State,
    { getCache, getAuthStore }: WorkerRootSagaOptions
) {
    const currentState: State = yield select();

    const authStore = getAuthStore();
    const keyPassword = authStore.getPassword();
    const userID = authStore.getUserID()!;
    const sessionLockToken = authStore.getLockToken();

    const encryptedCache: Partial<EncryptedPassCache> = yield getCache();
    const cache: Maybe<PassCache> = yield decryptCachedState(encryptedCache, sessionLockToken);
    const userState: SafeUserState = cache?.state.user ?? (yield resolveUserState(userID));

    const state: State = { ...(cache?.state ? merge(currentState, cache.state) : currentState), user: userState };
    const user = userState.user;
    const addresses = Object.values(userState.addresses);

    PassCrypto.clear();

    yield PassCrypto.hydrate({ user, keyPassword, addresses, snapshot: cache?.snapshot });
    yield put(stateHydrate(state));

    return cache?.state !== undefined;
}

function* hydrateWorker(options: WorkerRootSagaOptions) {
    try {
        yield put(stopEventPolling());
        yield hydrateFromCache((_, incoming) => incoming, options);
    } catch {
    } finally {
        yield put(startEventPolling());
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(stateSync.match, hydrateWorker, options);
}
