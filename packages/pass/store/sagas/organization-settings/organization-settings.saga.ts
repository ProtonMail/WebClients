import { call, put, takeLeading } from 'redux-saga/effects';

import { getOrganizationSettings } from '@proton/pass/lib/organization/organization.requests';
import {
    getOrganizationSettingsFailure,
    getOrganizationSettingsIntent,
    getOrganizationSettingsSuccess,
} from '@proton/pass/store/actions/creators/organizationSettings';
import { type OrganizationSettingsResponse } from '@proton/pass/types/data/organization';

function* getOrganizationSettingsWorker({ meta }: ReturnType<typeof getOrganizationSettingsIntent>) {
    try {
        const organizationSettings: OrganizationSettingsResponse = yield call(getOrganizationSettings);

        yield put(
            getOrganizationSettingsSuccess(meta.request.id, {
                shareMode: organizationSettings.Settings.ShareMode,
                exportMode: organizationSettings.Settings.ExportMode,
            })
        );
    } catch (error) {
        yield put(getOrganizationSettingsFailure(meta.request.id, {}, error));
    }
}

export default function* watcher() {
    yield takeLeading(getOrganizationSettingsIntent.match, getOrganizationSettingsWorker);
}
