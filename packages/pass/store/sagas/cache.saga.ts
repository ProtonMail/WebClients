import type { AnyAction } from 'redux';
import type { Task } from 'redux-saga';
import { cancel, fork, select, take, takeLatest } from 'redux-saga/effects';

import { authentication } from '@proton/pass/auth/authentication';
import { PassCrypto } from '@proton/pass/crypto';
import { CACHE_SALT_LENGTH, encryptData, getCacheEncryptionKey } from '@proton/pass/crypto/utils';
import { browserLocalStorage } from '@proton/pass/extension/storage';
import { EncryptionTag, type Maybe } from '@proton/pass/types';
import { or } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { objectDelete } from '@proton/pass/utils/object';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import { wait } from '@proton/shared/lib/helpers/promise';

import { signout, stateLock } from '../actions';
import { isCacheTriggeringAction } from '../actions/with-cache-block';
import { asIfNotOptimistic } from '../optimistic/selectors/select-is-optimistic';
import { reducerMap } from '../reducers';
import { selectSessionLockToken } from '../selectors';
import type { State, WorkerRootSagaOptions } from '../types';

function* cacheWorker(action: AnyAction, { onCacheRequest }: WorkerRootSagaOptions) {
    yield wait(500);

    if (authentication?.hasSession() && onCacheRequest()) {
        try {
            const sessionLockToken: Maybe<string> = yield select(selectSessionLockToken);
            const cacheSalt = crypto.getRandomValues(new Uint8Array(CACHE_SALT_LENGTH));
            const key: CryptoKey = yield getCacheEncryptionKey(cacheSalt, sessionLockToken);

            const state = (yield select()) as State;
            const nonOptimisticState = asIfNotOptimistic(state, reducerMap);
            const whiteListedState = objectDelete(nonOptimisticState, 'request');

            const encoder = new TextEncoder();
            const stringifiedState = JSON.stringify(whiteListedState);
            const encryptedData: Uint8Array = yield encryptData(
                key,
                encoder.encode(stringifiedState),
                EncryptionTag.Cache
            );

            const workerSnapshot = PassCrypto.serialize();
            const stringifiedSnapshot = JSON.stringify(workerSnapshot);

            const encryptedWorkerSnapshot: Uint8Array = yield encryptData(
                key,
                stringToUint8Array(stringifiedSnapshot),
                EncryptionTag.Cache
            );

            logger.info(`[Saga::Cache] Caching store and crypto state @ action["${action.type}"]`);
            yield browserLocalStorage.setItem('salt', uint8ArrayToString(cacheSalt));
            yield browserLocalStorage.setItem('state', uint8ArrayToString(encryptedData));
            yield browserLocalStorage.setItem('snapshot', uint8ArrayToString(encryptedWorkerSnapshot));
        } catch (_) {}
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLatest(isCacheTriggeringAction, function* (action: AnyAction) {
        const cacheTask: Task = yield fork(cacheWorker, action, options);

        yield take(or(stateLock.match, signout.match));
        logger.info(`[Saga::Cache] Invalidating all caching tasks`);
        yield cancel(cacheTask);
    });
}
