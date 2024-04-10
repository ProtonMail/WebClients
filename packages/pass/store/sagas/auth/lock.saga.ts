import { fork, takeLeading } from 'redux-saga/effects';

import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { lock } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';
import noop from '@proton/utils/noop';

/* If we the user has not registered a lock yet (ie: has
 * a sessionLockToken saved) then this saga should have
 * no effect. Fork the effect for non-blocking action -> immediate UI effect */
function* lockWorker({ getAuthService, getAuthStore: getAuth }: RootSagaOptions) {
    const mode = getAuth().getLockMode();

    if (mode !== LockMode.NONE) {
        yield fork(function* () {
            yield getAuthService().lock(mode, { soft: false }).catch(noop);
        });
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(lock.match, lockWorker, options);
}
