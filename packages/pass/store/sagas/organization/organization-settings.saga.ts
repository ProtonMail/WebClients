import { call, put, select, takeLeading } from 'redux-saga/effects';

import { getOrganizationSettings } from '@proton/pass/lib/organization/organization.requests';
import {
    getOrganizationSettingsFailure,
    getOrganizationSettingsIntent,
    getOrganizationSettingsSuccess,
} from '@proton/pass/store/actions/creators/organization';
import { selectOrganization } from '@proton/pass/store/selectors';
import type { MaybeNull, OrganizationGetResponse } from '@proton/pass/types';
import type { Organization } from '@proton/shared/lib/interfaces';

function* getOrganizationSettingsWorker({ meta }: ReturnType<typeof getOrganizationSettingsIntent>) {
    try {
        const organization: MaybeNull<Organization> = yield select(selectOrganization);
        if (!organization) throw new Error('User not in organization');

        const data: OrganizationGetResponse = yield call(getOrganizationSettings);
        yield put(getOrganizationSettingsSuccess(meta.request.id, data));
    } catch (error) {
        yield put(getOrganizationSettingsFailure(meta.request.id, {}, error));
    }
}

export default function* watcher() {
    yield takeLeading(getOrganizationSettingsIntent.match, getOrganizationSettingsWorker);
}
