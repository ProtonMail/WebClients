import { put } from 'redux-saga/effects';

import noop from '@proton/utils/noop';

import { lockSync } from '../../../store/actions';
import type { RootSagaOptions } from '../../../store/types';
import type { OrganizationGetResponse } from '../../../types';
import { LockMode } from '../../auth/lock/types';

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
