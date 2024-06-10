import { createAction } from '@reduxjs/toolkit';

import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { organizationSettingsRequest } from '@proton/pass/store/actions/requests';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import type { OrganizationGetResponse } from '@proton/pass/types';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';

export const getOrganizationSettingsIntent = createAction('organization::settings::get::intent', () =>
    withRequest({ status: 'start', id: organizationSettingsRequest() })({ payload: {} })
);

export const getOrganizationSettingsSuccess = createAction(
    'organization::settings::get::success',
    withRequestSuccess((payload: OrganizationGetResponse) => withCache({ payload }), { maxAge: 15 * UNIX_MINUTE })
);

export const getOrganizationSettingsFailure = createAction(
    'organization::settings::get::failure',
    withRequestFailure((payload: {}, error: unknown) => ({ payload, error }))
);
