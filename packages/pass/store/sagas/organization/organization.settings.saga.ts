import { call, put, select, takeLeading } from 'redux-saga/effects';

import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { getOrganizationSettings as fetchOrganizationSettings } from '@proton/pass/lib/organization/organization.requests';
import { lockSync } from '@proton/pass/store/actions';
import { getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import { selectOrganization } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { MaybeNull, OrganizationGetResponse } from '@proton/pass/types';
import type { Organization } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

/** Applies org-level lock policy from `ForceLockSeconds`. When the org
 * enforces a lock TTL that differs from the user's current value, updates
 * the auth store, dispatches `lockSync`, and re-persists the session.
 * If no lock is configured (`LockMode.NONE`), the user will be routed
 * to the lock-setup screen by `AppGuard`. */
export function* onOrganizationSettingsUpdated(settings: OrganizationGetResponse, options: RootSagaOptions) {
    const orgLockTTL = settings?.Settings?.ForceLockSeconds;

    if (orgLockTTL) {
        const authStore = options.getAuthStore();
        const auth = options.getAuthService();
        const lockMode = authStore.getLockMode();
        const lockTTL = authStore.getLockTTL();

        /** If the user's organization has a `ForceLockSeconds` setting, ensure
         * the user's local lock TTL matches and re-persist the session. If no lock
         * is setup, user will be brought to the "lock-setup" screen (`AppGuard.tsx`) */
        if (lockMode !== LockMode.NONE && lockTTL !== orgLockTTL) {
            authStore.setLockTTL(orgLockTTL);
            yield put(lockSync({ mode: lockMode, locked: false, ttl: orgLockTTL }));
            yield auth.persistSession().catch(noop);
        }
    }
}

function* getOrganizationSettingsWorker(options: RootSagaOptions, { meta }: ReturnType<typeof getOrganizationSettings.intent>) {
    try {
        const organization: MaybeNull<Organization> = yield select(selectOrganization);
        if (!organization) throw {};

        const settings: OrganizationGetResponse = yield call(fetchOrganizationSettings);
        yield put(getOrganizationSettings.success(meta.request.id, settings));
        yield call(onOrganizationSettingsUpdated, settings, options);
    } catch (error) {
        yield put(getOrganizationSettings.failure(meta.request.id, error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(getOrganizationSettings.intent.match, getOrganizationSettingsWorker, options);
}
