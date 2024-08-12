import { call, put, select, takeLeading } from 'redux-saga/effects';

import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { getOrganizationSettings as fetchOrganizationSettings } from '@proton/pass/lib/organization/organization.requests';
import { lockSync } from '@proton/pass/store/actions';
import { getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import { selectOrganization } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import { type MaybeNull, type OrganizationGetResponse } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import type { Organization } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

function* getOrganizationSettingsWorker(
    options: RootSagaOptions,
    { meta }: ReturnType<typeof getOrganizationSettings.intent>
) {
    try {
        const organization: MaybeNull<Organization> = yield select(selectOrganization);
        if (!organization) throw new Error('User not in organization');

        const data: OrganizationGetResponse = yield call(fetchOrganizationSettings);
        const orgLockTTL = data?.Settings?.ForceLockSeconds;

        yield put(getOrganizationSettings.success(meta.request.id, data));

        try {
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
        } catch (error) {
            logger.error(`[Saga::Org] Error updating lock TTL from organization's ForceLockSeconds: ${error}`);
        }
    } catch (error) {
        yield put(getOrganizationSettings.failure(meta.request.id, {}, error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(getOrganizationSettings.intent.match, getOrganizationSettingsWorker, options);
}
