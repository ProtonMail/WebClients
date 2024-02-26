import { put, select, takeLeading } from 'redux-saga/effects';

import { getUserAccess, getUserOrganization } from '@proton/pass/lib/user/user.requests';
import { getUserAccessFailure, getUserAccessIntent, getUserAccessSuccess } from '@proton/pass/store/actions';
import type { HydratedAccessState } from '@proton/pass/store/reducers';
import { selectUser } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { MaybeNull } from '@proton/pass/types';
import { PlanType, SessionLockStatus } from '@proton/pass/types';
import type { Organization, User } from '@proton/shared/lib/interfaces';

function* syncPlan({ getAuthStore }: RootSagaOptions, { meta }: ReturnType<typeof getUserAccessIntent>) {
    try {
        const loggedIn = getAuthStore().hasSession();
        const locked = getAuthStore().getLockStatus() === SessionLockStatus.LOCKED;
        const user: MaybeNull<User> = yield select(selectUser);
        if (!loggedIn || locked || !user) throw new Error('Cannot fetch user plan');

        const access: HydratedAccessState = yield getUserAccess();

        /* Resolve organisation data only for B2B users */
        const isB2B = access.plan?.Type === PlanType.business;
        const organization: MaybeNull<Organization> = isB2B ? yield getUserOrganization() : null;

        yield put(
            getUserAccessSuccess(meta.request.id, {
                ...access,
                organization: organization,
            })
        );
    } catch (error) {
        yield put(getUserAccessFailure(meta.request.id, error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(getUserAccessIntent.match, syncPlan, options);
}
