import { call, select } from 'redux-saga/effects';

import type { Organization } from '@proton/shared/lib/interfaces/Organization';

import { getUrlPauseList } from '../../../lib/organization/organization.requests';
import { intoPauseCriterias } from '../../../lib/settings/pause-list';
import type { OrganizationUrlPauseEntryDto } from '../../../types/api/pass';
import type { MaybeNull } from '../../../types/utils';
import { getOrganizationPauseList } from '../../actions/creators/organization';
import { createRequestSaga } from '../../request/sagas';
import { selectOrganization } from '../../selectors/organization';

export default createRequestSaga({
    actions: getOrganizationPauseList,
    call: function* () {
        const organization: MaybeNull<Organization> = yield select(selectOrganization);
        if (!organization) throw {};
        const entries: OrganizationUrlPauseEntryDto[] = yield call(getUrlPauseList);
        return intoPauseCriterias(entries);
    },
});
