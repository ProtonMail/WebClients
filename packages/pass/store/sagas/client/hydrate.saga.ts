import { call, put, select, takeLatest } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { decryptCachedState, sanitizeCache } from '@proton/pass/lib/crypto/utils/cache.decrypt';
import type { UserData } from '@proton/pass/lib/user/user.requests';
import { getUserData } from '@proton/pass/lib/user/user.requests';
import {
    cacheCancel,
    cacheRequest,
    startEventPolling,
    stateHydrate,
    stateSync,
    stopEventPolling,
    syncLocalSettings,
} from '@proton/pass/store/actions';
import type { HydratedUserState } from '@proton/pass/store/reducers';
import { selectLocale } from '@proton/pass/store/selectors';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import type { EncryptedPassCache, PassCache } from '@proton/pass/types/worker/cache';
import { throwError } from '@proton/pass/utils/fp/throw';
import { wait } from '@proton/shared/lib/helpers/promise';

/** `allowFailure` defines how we should treat cache decryption errors.
 * If `true` they will be by-passed - else you can pass a custom error
 * generator function that will be triggered */
type HydrateCacheOptions = { merge: (existing: State, incoming: State) => State } & (
    | { allowFailure: true }
    | { allowFailure: false; onError?: () => Generator }
);

function* resolveUserState(cache: Maybe<PassCache>) {
    if (cache?.state.user) return cache.state.user;

    const { access, addresses, eventId, features, organization, user, userSettings }: UserData = yield getUserData();
    yield put(syncLocalSettings({ locale: userSettings.Locale }));

    const userState: HydratedUserState = {
        ...access,
        addresses,
        eventId,
        features,
        organization,
        user,
        userSettings: {
            Email: { Status: userSettings.Email.Status },
            Telemetry: userSettings.Telemetry,
        },
    };

    return userState;
}

/** Will try to decrypt the store cache and hydrate the store accordingly. Returns a
 * boolean flag indicating wether hydration happened from cache or not. */
export function* hydrate(config: HydrateCacheOptions, { getCache, getAuthStore }: RootSagaOptions) {
    try {
        const authStore = getAuthStore();
        const keyPassword = authStore.getPassword() ?? '';
        const sessionLockToken = authStore.getLockToken();
        const encryptedCache: Partial<EncryptedPassCache> = yield getCache();

        const cache: Maybe<PassCache> = yield decryptCachedState(encryptedCache, sessionLockToken)
            .then(sanitizeCache)
            .catch((err) => (config.allowFailure ? undefined : throwError(err)));

        const userState: HydratedUserState = yield call(resolveUserState, cache);
        const user = userState.user;
        const addresses = Object.values(userState.addresses);
        const currentState: State = yield select();

        const state: State = {
            ...(cache?.state ? config.merge(currentState, cache.state) : currentState),
            user: userState,
        };

        yield PassCrypto.hydrate({ user, keyPassword, addresses, snapshot: cache?.snapshot, clear: true });
        yield put(stateHydrate(state));

        return cache?.state !== undefined && cache?.snapshot !== undefined;
    } catch {
        yield !config.allowFailure && config.onError?.();
        return false;
    }
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

    yield hydrate(
        {
            allowFailure: false,
            merge: (_, incoming) => incoming,
            onError: function* onError() {
                /** If hydrating from cache failed during a state sync : encryption
                 * scheme may have changed, as such trigger a cache request immediately */
                yield put(cacheRequest({ throttle: false }));
            },
        },
        options
    );

    /* locale may have been updated */
    options.onLocaleUpdated?.(yield select(selectLocale));

    yield put(startEventPolling());
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLatest(stateSync.match, hydrateWorker, options);
}
