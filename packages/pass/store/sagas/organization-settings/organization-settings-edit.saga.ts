import { put, takeLeading } from 'redux-saga/effects';

import { setOrganizationSettings } from '@proton/pass/lib/organization/organization.requests';
import {
    organizationSettingsEditFailure,
    organizationSettingsEditIntent,
    organizationSettingsEditSuccess,
} from '@proton/pass/store/actions/creators/organizationSettings';

function* organizationSettinsEditWorker({ meta, payload }: ReturnType<typeof organizationSettingsEditIntent>) {
    try {
        yield setOrganizationSettings({
            shareMode: payload.organizationSettings.shareMode,
        });
        yield put(
            organizationSettingsEditSuccess(meta.request.id, {
                shareMode: payload.organizationSettings.shareMode,
                exportMode: payload.organizationSettings.exportMode,
            })
        );
    } catch (error) {
        yield put(organizationSettingsEditFailure(meta.request.id, {}, error));
    }
}

export default function* watcher() {
    yield takeLeading(organizationSettingsEditIntent.match, organizationSettinsEditWorker);
}
