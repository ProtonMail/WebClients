import { call, select } from 'redux-saga/effects';

import { getUrlPauseList } from '@proton/pass/lib/organization/organization.requests';
import { intoPauseCriterias } from '@proton/pass/lib/settings/pause-list';
import { getOrganizationPauseList } from '@proton/pass/store/actions/creators/organization';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectOrganization } from '@proton/pass/store/selectors';
import type { MaybeNull, OrganizationUrlPauseEntryDto } from '@proton/pass/types';
import type { Organization } from '@proton/shared/lib/interfaces';

export default createRequestSaga({
    actions: getOrganizationPauseList,
    call: function* () {
        const organization: MaybeNull<Organization> = yield select(selectOrganization);
        if (!organization) throw {};
        const entries: OrganizationUrlPauseEntryDto[] = yield call(getUrlPauseList);
        return intoPauseCriterias(entries);
    },
});
