import { call, put, select, takeLeading } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/crypto';
import { isPassCryptoError } from '@proton/pass/crypto/utils/errors';
import type { Maybe, RequiredNonNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object';

import type { EncryptedExtensionCache, ExtensionCache } from '../../types/worker/cache';
import { boot, bootFailure, bootSuccess, stateSync, syncLocalSettings } from '../actions';
import type { UserState } from '../reducers';
import type { State, WorkerRootSagaOptions } from '../types';
import { decryptCachedState } from './workers/cache';
import { SyncType, type SynchronizationResult, synchronize } from './workers/sync';
import { getUserData } from './workers/user';

function* bootWorker(options: WorkerRootSagaOptions) {
    try {
        const sessionLockToken = options.getAuth().getLockToken();
        const encryptedCache: Partial<EncryptedExtensionCache> = yield options.getCache();
        const cache: Maybe<ExtensionCache> = yield decryptCachedState(encryptedCache, sessionLockToken);

        const currentState: State = yield select();
        const state = cache?.state ? merge(currentState, cache.state, { excludeEmpty: true }) : currentState;

        logger.info(`[Saga::Boot] ${cache !== undefined ? 'Booting from cache' : 'Cache not found during boot'}`);
        const { user, plan, addresses, eventId, features }: RequiredNonNull<UserState> = yield getUserData(state);

        yield call(PassCrypto.hydrate, {
            user,
            keyPassword: options.getAuth().getPassword(),
            addresses: Object.values(addresses),
            snapshot: cache?.snapshot,
        });

        /* hydrate the background store from cache - see `reducers/index.ts` */
        yield put(stateSync(state, { endpoint: 'background' }));
        yield put(syncLocalSettings(yield options.getLocalSettings()));

        /* trigger a partial synchronization */
        const sync = (yield synchronize(state, SyncType.PARTIAL, features, options)) as SynchronizationResult;
        yield put(bootSuccess({ user, plan, addresses, eventId, sync, features }));

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
