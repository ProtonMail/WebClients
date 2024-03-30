import { put, select, takeLeading } from 'redux-saga/effects';

import { setOrganizationSettings } from '@proton/pass/lib/organization/organization.requests';
import {
    organizationSettingsEditFailure,
    organizationSettingsEditIntent,
    organizationSettingsEditSuccess,
} from '@proton/pass/store/actions/creators/organization';
import { selectCanUpdateOrganization, selectOrganizationSettings } from '@proton/pass/store/selectors';
import type { MaybeNull, OrganizationGetResponse } from '@proton/pass/types';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';
import { partialMerge } from '@proton/pass/utils/object/merge';

function* organizationSettinsEditWorker({ meta, payload }: ReturnType<typeof organizationSettingsEditIntent>) {
    try {
        const settings: MaybeNull<OrganizationSettings> = yield select(selectOrganizationSettings);
        if (!settings) throw new Error('User is not in an organization');

        const canUpdate: boolean = yield select(selectCanUpdateOrganization);
        if (!canUpdate) throw new Error('User cannot update organization settings');

        const data: OrganizationGetResponse = yield setOrganizationSettings(partialMerge(settings, payload));
        yield put(organizationSettingsEditSuccess(meta.request.id, data));
    } catch (error) {
        yield put(organizationSettingsEditFailure(meta.request.id, {}, error));
    }
}

export default function* watcher() {
    yield takeLeading(organizationSettingsEditIntent.match, organizationSettinsEditWorker);
}
