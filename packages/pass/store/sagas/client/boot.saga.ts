import { all, call, put, select, takeLeading } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { decryptCachedState } from '@proton/pass/lib/crypto/utils/cache.decrypt';
import { isPassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import { getFeatureFlags, getUserAccess, getUserSettings } from '@proton/pass/lib/user/user.requests';
import {
    bootFailure,
    bootIntent,
    bootSuccess,
    getUserAccessSuccess,
    getUserFeaturesSuccess,
    startEventPolling,
    stateSync,
    stopEventPolling,
    syncLocalSettings,
} from '@proton/pass/store/actions';
import { userAccessRequest, userFeaturesRequest } from '@proton/pass/store/actions/requests';
import type { FeatureFlagState, SafeUserAccessState, SafeUserState } from '@proton/pass/store/reducers';
import type { SynchronizationResult } from '@proton/pass/store/sagas/client/sync';
import { SyncType, synchronize } from '@proton/pass/store/sagas/client/sync';
import { selectUserState } from '@proton/pass/store/selectors';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import type { EncryptedPassCache, PassCache } from '@proton/pass/types/worker/cache';
import { prop } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getLatestID } from '@proton/shared/lib/api/events';
import { getUser } from '@proton/shared/lib/api/user';
import { toMap } from '@proton/shared/lib/helpers/object';
import { type User } from '@proton/shared/lib/interfaces';

type UserData = Omit<SafeUserState, keyof SafeUserAccessState> & { access: SafeUserAccessState };

function* bootUserState(userId: string, state: State) {
    yield put(stopEventPolling());
    const { plan, waitingNewUserInvites, ...cached } = selectUserState(state);

    const { access, ...userState }: UserData = yield all({
        user: call(async () => cached.user ?? api<{ User: User }>(getUser()).then(prop('User'))),
        eventId: call(async () => cached.eventId ?? api<{ EventID: string }>(getLatestID()).then(prop('EventID'))),
        userSettings: call(async () => cached.userSettings ?? getUserSettings()),
        access: call(function* () {
            if (plan && waitingNewUserInvites !== undefined) return { plan, waitingNewUserInvites };
            const access: SafeUserAccessState = yield getUserAccess();
            yield put(getUserAccessSuccess(userAccessRequest(userId), access));
            return access;
        }),
        addresses: call(async () =>
            Object.keys(cached.addresses).length > 0
                ? cached.addresses
                : getAllAddresses(api).then((addresses) => toMap(addresses, 'ID'))
        ),

        features: call(function* () {
            if (cached.features) return cached.features;
            const features: FeatureFlagState = yield getFeatureFlags();
            yield put(getUserFeaturesSuccess(userFeaturesRequest(userId), features));
            return features;
        }),
    });

    return <SafeUserState>{ ...userState, ...access };
}

function* bootWorker(options: WorkerRootSagaOptions) {
    try {
        const auth = options.getAuthStore();
        const userId = auth.getUserID()!;
        const sessionLockToken = auth.getLockToken();

        const encryptedCache: Partial<EncryptedPassCache> = yield options.getCache();
        const cache: Maybe<PassCache> = yield decryptCachedState(encryptedCache, sessionLockToken);

        const currentState: State = yield select();
        const state = cache?.state ? merge(currentState, cache.state, { excludeEmpty: true }) : currentState;

        logger.info(`[Saga::Boot] ${cache !== undefined ? 'Booting from cache' : 'Cache not found during boot'}`);
        const userState: SafeUserState = yield call(bootUserState, userId, state);

        yield call(PassCrypto.hydrate, {
            user: userState.user,
            keyPassword: auth.getPassword(),
            addresses: Object.values(userState.addresses),
            snapshot: cache?.snapshot,
        });

        /* hydrate the background store from cache - see `reducers/index.ts` */
        yield put(stateSync(state, { endpoint: 'background' }));
        yield put(syncLocalSettings(yield options.getLocalSettings()));

        /* trigger a partial synchronization */
        const sync = (yield synchronize(state, SyncType.PARTIAL, userState.features, options)) as SynchronizationResult;
        yield put(bootSuccess({ sync, userState }));

        options.onBoot?.({ ok: true });
        yield put(startEventPolling());
    } catch (error: unknown) {
        logger.warn('[Saga::Boot]', error);
        yield put(bootFailure(error));
        options.onBoot?.({ ok: false, clearCache: isPassCryptoError(error) });
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(bootIntent.match, bootWorker, options);
}
