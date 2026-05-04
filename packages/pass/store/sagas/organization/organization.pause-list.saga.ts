import { call, put, select, takeLeading } from 'redux-saga/effects';

import { getUrlPauseList } from '@proton/pass/lib/organization/organization.requests';
import { intoDomainCriterias } from '@proton/pass/lib/settings/pause-list';
import { getOrganizationPauseList } from '@proton/pass/store/actions/creators/organization';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { selectOrganization, selectProxiedSettings } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { MaybeNull, OrganizationUrlPauseEntryDto } from '@proton/pass/types';
import type { Organization } from '@proton/shared/lib/interfaces';

function* getOrganizationPauseListWorker(
    { onSettingsUpdated }: RootSagaOptions,
    { meta }: ReturnType<typeof getOrganizationPauseList.intent>
) {
    try {
        const organization: MaybeNull<Organization> = yield select(selectOrganization);
        if (!organization) throw {};

        const entries: OrganizationUrlPauseEntryDto[] = yield call(getUrlPauseList);
        yield put(getOrganizationPauseList.success(meta.request.id, intoDomainCriterias(entries)));

        /** Re-broadcast settings so content scripts receive the merged
         * org + user pause list. The reducer has already stored the new
         * entries, so `selectOrgDisallowedDomains` returns the fresh set. */
        const settings: ProxiedSettings = yield select(selectProxiedSettings);
        yield onSettingsUpdated?.(settings);
    } catch (error) {
        yield put(getOrganizationPauseList.failure(meta.request.id, error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(getOrganizationPauseList.intent.match, getOrganizationPauseListWorker, options);
}
