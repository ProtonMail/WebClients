import { call, select } from 'redux-saga/effects';

import type { Organization } from '@proton/shared/lib/interfaces';

import { getUrlPauseList } from '../../../lib/organization/organization.requests';
import { intoPauseCriterias } from '../../../lib/settings/pause-list';
import type { MaybeNull, OrganizationUrlPauseEntryDto } from '../../../types';
import { getOrganizationPauseList } from '../../actions/creators/organization';
import { createRequestSaga } from '../../request/sagas';
import { selectOrganization } from '../../selectors';

export default createRequestSaga({
    actions: getOrganizationPauseList,
    call: function* () {
        const organization: MaybeNull<Organization> = yield select(selectOrganization);
        if (!organization) throw {};
        const entries: OrganizationUrlPauseEntryDto[] = yield call(getUrlPauseList);
        return intoPauseCriterias(entries);
    },
});
