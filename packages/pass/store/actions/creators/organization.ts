import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/actions/enhancers/request';
import { organizationSettingsEditRequest, organizationSettingsRequest } from '@proton/pass/store/actions/requests';
import type { OrganizationGetResponse } from '@proton/pass/types';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';

export const getOrganizationSettingsIntent = createAction('organization::settings::get::intent', () =>
    withRequest({ type: 'start', id: organizationSettingsRequest() })({ payload: {} })
);

export const getOrganizationSettingsSuccess = createAction(
    'organization::settings::get::success',
    withRequestSuccess((payload: OrganizationGetResponse) => withCache({ payload }), { maxAge: 15 * UNIX_MINUTE })
);

export const getOrganizationSettingsFailure = createAction(
    'organization::settings::get::failure',
    withRequestFailure((payload: {}, error: unknown) => ({ payload, error }))
);

export const organizationSettingsEditIntent = createAction(
    'organizationSettings::edit',
    (payload: Partial<OrganizationSettings>) =>
        pipe(
            withRequest({ type: 'start', id: organizationSettingsEditRequest() }),
            withNotification({
                type: 'info',
                text: c('Info').t`Updating organization settings`,
                loading: true,
            })
        )({ payload })
);

export const organizationSettingsEditSuccess = createAction(
    'organizationSettings::edit::success',
    withRequestSuccess((payload: OrganizationGetResponse) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`Organization settings successfully updated`,
            })
        )({ payload })
    )
);

export const organizationSettingsEditFailure = createAction(
    'organizationSettings::edit::failure',
    withRequestFailure((payload: {}, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to edit organization settings`,
            error,
        })({ payload, error })
    )
);
