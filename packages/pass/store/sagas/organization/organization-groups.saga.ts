import { call, put, select, takeLeading } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { getOrganizationGroups as fetchOrganizationGroups } from '@proton/pass/lib/organization/organization.requests';
import { getOrganizationGroups } from '@proton/pass/store/actions/creators/organization';
import { selectOrganization } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { MaybeNull } from '@proton/pass/types';
import type { GroupsGetResponse } from '@proton/pass/types/api/core';
import type { Organization } from '@proton/shared/lib/interfaces';

function* getOrganizationGroupsWorker(options: RootSagaOptions, { meta }: ReturnType<typeof getOrganizationGroups.intent>) {
    try {
        const organization: MaybeNull<Organization> = yield select(selectOrganization);
        if (!organization) throw new Error('User not in organization');

        const groups: GroupsGetResponse = yield call(fetchOrganizationGroups);

        /** Add groups to crypto context */
        PassCrypto.setGroupKeys(groups.Groups);

        yield put(getOrganizationGroups.success(meta.request.id, groups));
    } catch (error) {
        yield put(getOrganizationGroups.failure(meta.request.id, {}, error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(getOrganizationGroups.intent.match, getOrganizationGroupsWorker, options);
}
