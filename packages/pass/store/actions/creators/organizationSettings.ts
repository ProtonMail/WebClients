import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/actions/enhancers/request';
import { organizationSettingsEditRequest, organizationSettingsRequest } from '@proton/pass/store/actions/requests';
import { type Maybe } from '@proton/pass/types';
import { type OrganizationSettings } from '@proton/pass/types/data/organization';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';

export const getOrganizationSettingsIntent = createAction('organizationSettings::get', () =>
    withRequest({ type: 'start', id: organizationSettingsRequest() })({ payload: {} })
);

export const getOrganizationSettingsSuccess = createAction(
    'organizationSettings::get::success',
    withRequestSuccess((payload: Maybe<OrganizationSettings>) => withCache({ payload }), { maxAge: UNIX_MINUTE * 2 })
);

export const getOrganizationSettingsFailure = createAction(
    'organizationSettings::get::failure',
    withRequestFailure((payload: {}, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to get organization settings`,
            error,
        })({ payload, error })
    )
);

export const organizationSettingsEditIntent = createAction(
    'organizationSettings::edit',
    (payload: { organizationSettings: OrganizationSettings }) =>
        withRequest({ type: 'start', id: organizationSettingsEditRequest() })({ payload })
);

export const organizationSettingsEditSuccess = createAction(
    'organizationSettings::edit::success',
    withRequestSuccess((payload: Maybe<OrganizationSettings>) =>
        withNotification({
            type: 'info',
            text: c('Info').t`Organization settings successfully edited`,
        })({ payload })
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
