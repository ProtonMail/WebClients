import { call, put, select, takeLeading } from 'redux-saga/effects';

import { getOrganizationSettings as fetchOrganizationSettings } from '@proton/pass/lib/organization/organization.requests';
import { onOrganizationSettingsUpdated } from '@proton/pass/lib/sync/common/organization';
import { getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import { selectOrganization } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { MaybeNull, OrganizationGetResponse } from '@proton/pass/types';
import type { Organization } from '@proton/shared/lib/interfaces';

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
