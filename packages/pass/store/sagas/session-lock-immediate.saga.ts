import { fork, put, select, takeLeading } from 'redux-saga/effects';

import { lockSessionImmediate } from '@proton/pass/auth/session-lock';
import type { Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import { offlineLock, sessionLock, stateCache } from '../actions';
import { selectSessionLockToken } from '../selectors';
import type { WorkerRootSagaOptions } from '../types';

/* If we the user has not registered a lock yet (ie: has
 * a sessionLockToken saved) then this saga should have
 * no effect */
function* lockSessionImmediateWorker({ onSessionLocked }: WorkerRootSagaOptions) {
    const storageToken: Maybe<string> = yield select(selectSessionLockToken);
    if (storageToken !== undefined) {
        yield put(stateCache());
        /* fork for non-blocking action -> immediate UI effect */
        yield fork(function* () {
            try {
                yield lockSessionImmediate();
            } catch (e) {
                logger.info('[Saga::SessionLock] Could not lock session on back-end');
                yield put(offlineLock()); /* TODO: handle offline locking -> lock on next boot */
            }
        });

        onSessionLocked?.(storageToken);
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(sessionLock.match, lockSessionImmediateWorker, options);
}
