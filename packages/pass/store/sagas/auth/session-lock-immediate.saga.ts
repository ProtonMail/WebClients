import { fork, put, takeLeading } from 'redux-saga/effects';

import { lockSessionImmediate } from '@proton/pass/lib/auth/session-lock';
import { sessionLockIntent, stateCache } from '@proton/pass/store/actions';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import { logger } from '@proton/pass/utils/logger';

/* If we the user has not registered a lock yet (ie: has
 * a sessionLockToken saved) then this saga should have
 * no effect */
function* lockSessionImmediateWorker({ onSessionLocked, getAuth }: WorkerRootSagaOptions) {
    const sessionLockToken = getAuth().getLockToken();

    if (sessionLockToken !== undefined) {
        yield put(stateCache());
        /* fork for non-blocking action -> immediate UI effect */
        yield fork(function* () {
            try {
                yield lockSessionImmediate();
            } catch (e) {
                logger.info('[Saga::SessionLock] Could not lock session on back-end');
            }
        });

        yield onSessionLocked?.();
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(sessionLockIntent.match, lockSessionImmediateWorker, options);
}
