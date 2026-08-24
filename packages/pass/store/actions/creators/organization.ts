import { createAction } from '@reduxjs/toolkit';

import type { DomainCriterias } from '../../../lib/settings/pause-list';
import type { MaybeNull, OrganizationGetResponse } from '../../../types';
import { pipe } from '../../../utils/fp/pipe';
import { UNIX_MINUTE } from '../../../utils/time/constants';
import type { OrganizationState } from '../../reducers/organization';
import { cachedRequest } from '../../request/configs';
import { requestActionsFactory } from '../../request/flow';
import { withCache } from '../enhancers/cache';
import { withSettings } from '../enhancers/settings';

export const getOrganizationSettings = requestActionsFactory<void, OrganizationGetResponse, void>('organization::settings::get')({
    success: { ...cachedRequest(15 * UNIX_MINUTE), prepare: (payload) => withCache({ payload }) },
});

export const getOrganizationPauseList = requestActionsFactory<void, DomainCriterias, void>('organization::pause-list::get')({
    success: { ...cachedRequest(15 * UNIX_MINUTE), prepare: (payload) => pipe(withSettings, withCache)({ payload }) },
});
export const setOrganization = createAction<MaybeNull<OrganizationState>>('organization::set');
export const setOrganizationSettings = createAction<OrganizationGetResponse>('organization::settings::set');
