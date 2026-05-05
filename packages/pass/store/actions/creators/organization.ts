import type { DomainCriterias } from '@proton/pass/lib/settings/pause-list';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withSettings } from '@proton/pass/store/actions/enhancers/settings';
import { cachedRequest } from '@proton/pass/store/request/configs';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { OrganizationGetResponse } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';

export const getOrganizationSettings = requestActionsFactory<void, OrganizationGetResponse, void>('organization::settings::get')({
    success: { ...cachedRequest(15 * UNIX_MINUTE), prepare: (payload) => withCache({ payload }) },
});

export const getOrganizationPauseList = requestActionsFactory<void, DomainCriterias, void>('organization::pause-list::get')({
    success: { ...cachedRequest(15 * UNIX_MINUTE), prepare: (payload) => pipe(withSettings, withCache)({ payload }) },
});
