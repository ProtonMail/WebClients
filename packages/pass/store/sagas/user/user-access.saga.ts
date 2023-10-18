import { put, takeEvery } from 'redux-saga/effects';

import { getUserAccess } from '@proton/pass/lib/user/user.requests';
import { getUserAccessFailure, getUserAccessIntent, getUserAccessSuccess } from '@proton/pass/store/actions';
import type { SafeUserAccessState } from '@proton/pass/store/reducers';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import { SessionLockStatus } from '@proton/pass/types';

function* syncPlan({ getAuth }: WorkerRootSagaOptions, { meta }: ReturnType<typeof getUserAccessIntent>) {
    try {
        const loggedIn = getAuth().hasSession();
        const locked = getAuth().getLockStatus() === SessionLockStatus.LOCKED;
        if (!loggedIn || locked) throw new Error('Cannot fetch user plan');

        const access: SafeUserAccessState = yield getUserAccess();
        yield put(getUserAccessSuccess(meta.request.id, access));
    } catch (error) {
        yield put(getUserAccessFailure(meta.request.id, error));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(getUserAccessIntent.match, syncPlan, options);
}
