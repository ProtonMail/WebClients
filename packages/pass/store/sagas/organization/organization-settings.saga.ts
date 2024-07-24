import { call, put, select, takeLeading } from 'redux-saga/effects';

import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { getOrganizationSettings } from '@proton/pass/lib/organization/organization.requests';
import { lockSync } from '@proton/pass/store/actions';
import {
    getOrganizationSettingsFailure,
    getOrganizationSettingsIntent,
    getOrganizationSettingsSuccess,
} from '@proton/pass/store/actions/creators/organization';
import { selectOrganization } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import { AppStatus, type MaybeNull, type OrganizationGetResponse } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import type { Organization } from '@proton/shared/lib/interfaces';

function* getOrganizationSettingsWorker(
    options: RootSagaOptions,
    { meta }: ReturnType<typeof getOrganizationSettingsIntent>
) {
    try {
        const organization: MaybeNull<Organization> = yield select(selectOrganization);
        if (!organization) throw new Error('User not in organization');

        const data: OrganizationGetResponse = yield call(getOrganizationSettings);
        yield put(getOrganizationSettingsSuccess(meta.request.id, data));

        /* if the user has an org, check if the org's ForceLockSeconds setting is set
        /* if it is set and the user has no lock mode, show them a screen to setup lock */
        try {
            if (data?.Settings?.ForceLockSeconds) {
                const authStore = options.getAuthStore();
                const lockMode = authStore.getLockMode();
                const ttl = authStore.getLockTTL();
                if (lockMode === LockMode.NONE) {
                    logger.info(`[Saga::Org] Lock setup required by organization`);
                    options.setAppStatus(AppStatus.LOCK_SETUP);
                } else if (ttl !== data.Settings.ForceLockSeconds) {
                    authStore.setLockTTL(data.Settings.ForceLockSeconds);
                    yield put(
                        lockSync({
                            mode: lockMode,
                            locked: false,
                            ttl: data.Settings.ForceLockSeconds,
                        })
                    );
                    logger.info(`[Saga::Org] Lock TTL updated to ${data.Settings.ForceLockSeconds}s by organization`);
                }
            }
        } catch (error) {
            logger.error(`[Saga::Org] Error updating lock TTL from organization's ForceLockSeconds: ${error}`);
        }
    } catch (error) {
        yield put(getOrganizationSettingsFailure(meta.request.id, {}, error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(getOrganizationSettingsIntent.match, getOrganizationSettingsWorker, options);
}
