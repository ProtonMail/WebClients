import { put, takeEvery } from 'redux-saga/effects';

import { getUserAccess } from '@proton/pass/lib/user/user.requests';
import { getUserAccessFailure, getUserAccessIntent, getUserAccessSuccess } from '@proton/pass/store/actions';
import type { SafeUserAccessState } from '@proton/pass/store/reducers';
import type { RootSagaOptions } from '@proton/pass/store/types';
import { SessionLockStatus } from '@proton/pass/types';

function* syncPlan({ getAuthStore }: RootSagaOptions, { meta }: ReturnType<typeof getUserAccessIntent>) {
    try {
        const loggedIn = getAuthStore().hasSession();
        const locked = getAuthStore().getLockStatus() === SessionLockStatus.LOCKED;
        if (!loggedIn || locked) throw new Error('Cannot fetch user plan');

        const access: SafeUserAccessState = yield getUserAccess();
        yield put(getUserAccessSuccess(meta.request.id, access));
    } catch (error) {
        yield put(getUserAccessFailure(meta.request.id, error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(getUserAccessIntent.match, syncPlan, options);
}
