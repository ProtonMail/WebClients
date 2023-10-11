import { put, select, takeLeading } from 'redux-saga/effects';

import { getUserPlan } from '@proton/pass/lib/user/user.requests';
import { setUserPlan, wakeupSuccess } from '@proton/pass/store/actions';
import type { UserPlanState } from '@proton/pass/store/reducers';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';
import { SessionLockStatus } from '@proton/pass/types';

/* Try to sync the user plan on each wakeup success */
function* syncPlan({ getAuth }: WorkerRootSagaOptions) {
    try {
        const loggedIn = getAuth().hasSession();
        const locked = getAuth().getLockStatus() === SessionLockStatus.LOCKED;

        if (loggedIn && !locked) {
            const { user }: State = yield select();
            const plan: UserPlanState = yield getUserPlan(user);
            yield plan !== user.plan && put(setUserPlan(plan));
        }
    } catch (_) {}
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(wakeupSuccess.match, syncPlan, options);
}
