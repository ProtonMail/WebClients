import { createAction } from '@reduxjs/toolkit';

import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withSettings } from '@proton/pass/store/actions/enhancers/settings';
import { userAccessRequest, userFeaturesRequest } from '@proton/pass/store/actions/requests';
import type { FeatureFlagState, HydratedAccessState } from '@proton/pass/store/reducers';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import identity from '@proton/utils/identity';

export const getUserFeaturesIntent = createAction('user::features::get::intent', (userId: string) =>
    withRequest({ status: 'start', id: userFeaturesRequest(userId) })({ payload: {} })
);

export const getUserFeaturesSuccess = createAction(
    'user::features::get::success',
    withRequestSuccess((payload: FeatureFlagState) => pipe(withCache, withSettings)({ payload }), {
        maxAge: UNIX_HOUR / 2,
    })
);

export const getUserFeaturesFailure = createAction(
    'user::features::get::failure',
    withRequestFailure((error: unknown) => ({ payload: {}, error }))
);

export const getUserAccessIntent = createAction('user::access::get::intent', (userId: string) =>
    withRequest({ status: 'start', id: userAccessRequest(userId) })({ payload: {} })
);

export const getUserAccessSuccess = createAction(
    'user::access::get::success',
    withRequestSuccess((payload: HydratedAccessState) => withCache({ payload }), { maxAge: UNIX_HOUR / 2 })
);

export const getUserAccessFailure = createAction(
    'user::access::get::failure',
    withRequestFailure((error: unknown) => ({ payload: {}, error }))
);

export const getUserSettings = requestActionsFactory<string, UserSettings>('user::settings::get')({ key: identity });
