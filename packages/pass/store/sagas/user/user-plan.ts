import { put, takeEvery } from 'redux-saga/effects';

import { getUserPlan } from '@proton/pass/lib/user/user.requests';
import { getUserPlanFailure, getUserPlanIntent, getUserPlanSuccess } from '@proton/pass/store/actions';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import type { PassPlanResponse } from '@proton/pass/types';
import { SessionLockStatus } from '@proton/pass/types';

function* syncPlan({ getAuth }: WorkerRootSagaOptions, { meta }: ReturnType<typeof getUserPlanIntent>) {
    try {
        const loggedIn = getAuth().hasSession();
        const locked = getAuth().getLockStatus() === SessionLockStatus.LOCKED;
        if (!loggedIn || locked) throw new Error('Cannot fetch user plan');

        const plan: PassPlanResponse = yield getUserPlan();
        yield put(getUserPlanSuccess(meta.request.id, plan));
    } catch (error) {
        yield put(getUserPlanFailure(meta.request.id, error));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(getUserPlanIntent.match, syncPlan, options);
}
