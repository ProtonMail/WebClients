import { call, put, select, takeLeading } from 'redux-saga/effects';

import type { Organization } from '@proton/shared/lib/interfaces';

import { PassCrypto } from '../../../lib/crypto';
import { getGroups as fetchGroups } from '../../../lib/groups/groups.requests';
import type { GroupsResponse } from '../../../lib/groups/groups.types';
import type { MaybeNull } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { getGroups } from '../../actions/creators/groups';
import { selectFeatureFlag, selectOrganization } from '../../selectors';

function* getGroupsWorker({ meta }: ReturnType<typeof getGroups.intent>) {
    try {
        const enabled: boolean = yield select(selectFeatureFlag(PassFeature.PassGroupInvitesV1));
        if (!enabled) throw {};
        const organization: MaybeNull<Organization> = yield select(selectOrganization);

        const response: GroupsResponse = yield call(fetchGroups);

        response.groups.forEach((group) => {
            // We assume that groups coming from get all groups requests
            // Are only listed because they're public in the organization
            if (organization !== null) group.organizationId = organization.ID;

            // Add groups to crypto context
            PassCrypto.setGroup(group);
        });

        yield put(getGroups.success(meta.request.id, response));
    } catch (error) {
        yield put(getGroups.failure(meta.request.id, error));
    }
}

export default function* watcher() {
    yield takeLeading(getGroups.intent.match, getGroupsWorker);
}
