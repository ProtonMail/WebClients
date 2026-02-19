import { call, put, select, takeLeading } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { getOrganizationGroups as fetchOrganizationGroups } from '@proton/pass/lib/organization/organization.requests';
import { getOrganizationGroups } from '@proton/pass/store/actions/creators/organization';
import { selectFeatureFlag, selectOrganization } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import type { GroupsGetResponse } from '@proton/pass/types/api/core';
import { PassFeature } from '@proton/pass/types/api/features';
import type { Organization } from '@proton/shared/lib/interfaces';

function* getOrganizationGroupsWorker({ meta }: ReturnType<typeof getOrganizationGroups.intent>) {
    try {
        const enabled: boolean = yield select(selectFeatureFlag(PassFeature.PassGroupInvitesV1));
        const organization: MaybeNull<Organization> = yield select(selectOrganization);
        if (!(organization && enabled)) throw {};

        /** Add groups to crypto context */
        const groups: GroupsGetResponse = yield call(fetchOrganizationGroups);
        PassCrypto.setGroupKeys(groups.Groups);

        yield put(getOrganizationGroups.success(meta.request.id, groups));
    } catch (error) {
        yield put(getOrganizationGroups.failure(meta.request.id, {}, error));
    }
}

export default function* watcher() {
    yield takeLeading(getOrganizationGroups.intent.match, getOrganizationGroupsWorker);
}
