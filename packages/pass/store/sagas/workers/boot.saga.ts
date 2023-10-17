import { call, put, select, takeLeading } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { decryptCachedState } from '@proton/pass/lib/crypto/utils/cache.decrypt';
import { isPassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import { getUserData } from '@proton/pass/lib/user/user.requests';
import { boot, bootFailure, bootSuccess, stateSync, syncLocalSettings } from '@proton/pass/store/actions';
import type { UserState } from '@proton/pass/store/reducers';
import type { SynchronizationResult } from '@proton/pass/store/sagas/workers/sync';
import { SyncType, synchronize } from '@proton/pass/store/sagas/workers/sync';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';
import type { Maybe, RequiredNonNull } from '@proton/pass/types';
import type { EncryptedExtensionCache, ExtensionCache } from '@proton/pass/types/worker/cache';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';

function* bootWorker(options: WorkerRootSagaOptions) {
    try {
        const sessionLockToken = options.getAuth().getLockToken();
        const encryptedCache: Partial<EncryptedExtensionCache> = yield options.getCache();
        const cache: Maybe<ExtensionCache> = yield decryptCachedState(encryptedCache, sessionLockToken);

        const currentState: State = yield select();
        const state = cache?.state ? merge(currentState, cache.state, { excludeEmpty: true }) : currentState;

        logger.info(`[Saga::Boot] ${cache !== undefined ? 'Booting from cache' : 'Cache not found during boot'}`);
        const data: RequiredNonNull<UserState> = yield getUserData(state);

        yield call(PassCrypto.hydrate, {
            user: data.user,
            keyPassword: options.getAuth().getPassword(),
            addresses: Object.values(data.addresses),
            snapshot: cache?.snapshot,
        });

        /* hydrate the background store from cache - see `reducers/index.ts` */
        yield put(stateSync(state, { endpoint: 'background' }));
        yield put(syncLocalSettings(yield options.getLocalSettings()));

        /* trigger a partial synchronization */
        const sync = (yield synchronize(state, SyncType.PARTIAL, data.features, options)) as SynchronizationResult;
        yield put(bootSuccess({ ...data, sync }));

        options.onBoot?.({ ok: true });
    } catch (error: unknown) {
        logger.warn('[Saga::Boot]', error);
        yield put(bootFailure(error));

        options.onBoot?.({
            ok: false,
            clearCache: isPassCryptoError(error),
        });
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(boot.match, bootWorker, options);
}
