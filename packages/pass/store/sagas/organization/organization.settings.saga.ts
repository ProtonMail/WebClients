import { call, put, select, takeLeading } from 'redux-saga/effects';

import type { Organization } from '@proton/shared/lib/interfaces';

import { getOrganizationSettings as fetchOrganizationSettings } from '../../../lib/organization/organization.requests';
import { onOrganizationSettingsUpdated } from '../../../lib/sync/common/organization';
import type { MaybeNull, OrganizationGetResponse } from '../../../types';
import { getOrganizationSettings } from '../../actions/creators/organization';
import { selectOrganization } from '../../selectors';
import type { RootSagaOptions } from '../../types';

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
